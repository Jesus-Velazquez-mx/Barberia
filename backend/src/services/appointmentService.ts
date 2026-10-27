import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import {
    createAppointmentWithServices,
    getAppointmentById,
    getAppointments,
    getServicesByAppointmentIds,
    updateAppointmentWithServices,
} from '../repositories/appointmentRepository.js';
import { getShopById, getShopIdsByManagerId } from '../repositories/shopRepository.js';
import { getBarberById } from '../repositories/barberRepository.js';
import { getAppointmentClientsById, getClientByUserId } from '../repositories/clientRepository.js';
import { getReceptionistByUserId } from '../repositories/receptionistRepository.js';
import { getAllShifts } from '../repositories/shiftRepository.js';
import { getAvailableSlots, getBookableServices } from './availabilityService.js';
import {
    canCreateAppointment,
    canEditAppointment,
    canViewShopAppointments,
    isWithinClientEditCutoff,
} from './userPermissions.js';
import { isUserSessionValid } from '../utils/userSession.js';
import { toAppointmentResponse, toClientAppointmentResponse } from '../utils/appointmentMapper.js';
import { getBusinessDayStart, getBusinessToday, timeToMinutes, toBusinessWallClockMs } from '../utils/businessTime.js';
import type { AppointmentListFilters } from '../repositories/appointmentRepository.js';
import type { AppointmentService } from '../types/entities/appointmentService.interface.js';
import type {
    CreateAppointmentRequest,
    ListAppointmentsQuery,
    UpdateAppointmentRequest,
} from '../types/dto/appointmentRequest.interface.js';
import type { AppointmentResponse, ClientAppointmentResponse } from '../types/dto/appointmentResponse.interface.js';

const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE;
const DEFAULT_WINDOW_DAYS = 30;
const MAX_WINDOW_DAYS = 366;

/**
 * Agenda una nueva cita para un cliente registrado o un invitado.
 * Discrimina por rol con canCreateAppointment y solo acepta un horario que
 * GET /shops/:id/availability ofrecería para ese barbero y esos servicios.
 */
export const registerAppointment = async (
    data: CreateAppointmentRequest,
    token: string
): Promise<AppointmentResponse | ClientAppointmentResponse> => {
    const performer = await isUserSessionValid(token);

    // Un cliente que no indica a quién agenda, agenda para sí mismo.
    const clientId = data.guestClientName
        ? null
        : (data.clientId ?? (performer.role === 'client' ? performer.id : null));
    if (clientId === null && !data.guestClientName) {
        throw new ApiError(ApiErrorCode.INVALID_INPUT, 'Either clientId or guestClientName is required');
    }

    // Un barbero pertenece a una sola sucursal, así que shopId se deriva de barberId
    // en vez de pedirse por separado (y poder no coincidir con la del barbero).
    const barber = await getBarberById(data.barberId);
    if (!barber) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Barber not found');
    }

    const shop = await getShopById(barber.shop_id);
    if (!shop || !shop.is_active) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Shop not found or is inactive');
    }

    const receptionistShopId =
        performer.role === 'receptionist' ? ((await getReceptionistByUserId(performer.id))?.shop_id ?? null) : null;

    if (
        !canCreateAppointment(
            performer,
            { clientId, shopId: shop.id, shopManagerId: shop.manager_id },
            receptionistShopId
        )
    ) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Not authorized to create this appointment');
    }

    if (clientId !== null && !(await getClientByUserId(clientId))) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Client not found');
    }

    // Reutiliza el cálculo de disponibilidad: valida fecha (no pasada, máx. días de anticipación),
    // servicios, barbero elegible, turno (día abierto) y citas existentes.
    // scheduledStart es un instante UTC real; el día de negocio al que pertenece se calcula en
    // BUSINESS_TIMEZONE (no recortando el ISO en UTC: cerca de medianoche el día de calendario
    // del negocio puede no coincidir con el día de calendario en UTC).
    const scheduledStart = new Date(data.scheduledStart);
    const startIso = scheduledStart.toISOString();
    const availability = await getAvailableSlots({
        shopId: shop.id,
        date: getBusinessToday(scheduledStart.getTime()),
        serviceIds: data.serviceIds,
    });
    const barberSlots = availability.find((b) => b.barberId === data.barberId);
    if (!barberSlots) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Barber not found or is not accepting bookings at this shop');
    }
    if (!barberSlots.startTimes.includes(startIso)) {
        throw new ApiError(ApiErrorCode.CONFLICT, 'Selected time slot is not available');
    }

    // getAvailableSlots ya confirmó que existen y están activos.
    const services = await getBookableServices(data.serviceIds);
    const durationMinutes = services.reduce((sum, s) => sum + s.duration_minutes, 0);

    const { appointment, services: bookedServices } = await createAppointmentWithServices({
        shopId: shop.id,
        barberId: data.barberId,
        clientId,
        guestClientName: data.guestClientName ?? null,
        scheduledStart,
        scheduledEnd: new Date(scheduledStart.getTime() + durationMinutes * MS_PER_MINUTE),
        notes: data.notes ?? null,
        services: services.map((s) => ({
            serviceId: s.id,
            priceAtBooking: s.price,
            durationMinutesAtBooking: s.duration_minutes,
        })),
    });

    if (performer.role === 'client') {
        return toClientAppointmentResponse(appointment, bookedServices);
    }

    const [client] = await getAppointmentClientsById(clientId !== null ? [clientId] : []);
    return toAppointmentResponse(appointment, bookedServices, client ?? null);
};

/** Días después de la fecha en que se agendó dentro de los cuales se puede reprogramar una cita. */
const RESCHEDULE_WINDOW_DAYS = 30;

/**
 * Edita una cita (horario, barbero, servicios y notas). El cliente, el invitado y la sucursal no cambian.
 * Valida rol y alcance, estado (scheduled / rescheduled), que la cita no haya empezado, el límite de 8 horas
 * (solo clientes), la ventana de 30 días desde que se agendó y la disponibilidad del barbero excluyendo la
 * propia cita. Cambiar horario o barbero la deja en `rescheduled`; editar solo servicios o notas conserva el estado.
 */
export const updateAppointment = async (
    appointmentId: string,
    data: UpdateAppointmentRequest,
    token: string
): Promise<AppointmentResponse | ClientAppointmentResponse> => {
    const performer = await isUserSessionValid(token);

    const appointment = await getAppointmentById(appointmentId);
    if (!appointment) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Appointment not found');
    }

    const shop = await getShopById(appointment.shop_id);
    if (!shop) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Shop not found');
    }

    const receptionistShopId =
        performer.role === 'receptionist' ? ((await getReceptionistByUserId(performer.id))?.shop_id ?? null) : null;

    if (
        !canEditAppointment(
            performer,
            { clientId: appointment.client_id, shopId: appointment.shop_id, shopManagerId: shop.manager_id },
            receptionistShopId
        )
    ) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Not authorized to edit this appointment');
    }

    if (appointment.status !== 'scheduled' && appointment.status !== 'rescheduled') {
        throw new ApiError(ApiErrorCode.CONFLICT, 'Only scheduled or rescheduled appointments can be edited');
    }

    const now = new Date();
    if (appointment.scheduled_start.getTime() <= now.getTime()) {
        throw new ApiError(ApiErrorCode.CONFLICT, 'Only future appointments can be edited');
    }
    if (!isWithinClientEditCutoff(performer, appointment.scheduled_start, now)) {
        throw new ApiError(
            ApiErrorCode.FORBIDDEN,
            'Clients cannot edit an appointment less than 8 hours before it starts'
        );
    }

    // Valores finales: lo que no se manda se conserva.
    const barberId = data.barberId ?? appointment.barber_id;
    const scheduledStart = data.scheduledStart ? new Date(data.scheduledStart) : appointment.scheduled_start;
    const barberChanged = barberId !== appointment.barber_id;
    const startChanged = scheduledStart.getTime() !== appointment.scheduled_start.getTime();
    const notes = data.notes !== undefined ? data.notes : appointment.notes;

    const barber = await getBarberById(barberId);
    if (!barber || barber.deleted_at !== null) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Barber not found');
    }
    if (barberChanged) {
        if (barber.shop_id !== appointment.shop_id) {
            throw new ApiError(ApiErrorCode.INVALID_INPUT, 'Barber must belong to the same shop as the appointment');
        }
        if (!barber.is_accepting_bookings) {
            throw new ApiError(ApiErrorCode.INVALID_INPUT, 'Barber is not accepting bookings');
        }
    }

    // Los servicios que ya estaban agendados conservan su snapshot; los nuevos usan el catálogo actual.
    const currentServices = await getServicesByAppointmentIds([appointment.id]);
    let finalServices = currentServices.map((s) => ({
        serviceId: s.service_id,
        priceAtBooking: s.price_at_booking,
        durationMinutesAtBooking: s.duration_minutes_at_booking,
    }));
    if (data.serviceIds) {
        const catalog = await getBookableServices(data.serviceIds);
        const currentById = new Map(finalServices.map((s) => [s.serviceId, s]));
        finalServices = catalog.map(
            (s) =>
                currentById.get(s.id) ?? {
                    serviceId: s.id,
                    priceAtBooking: s.price,
                    durationMinutesAtBooking: s.duration_minutes,
                }
        );
    }
    const servicesChanged =
        data.serviceIds !== undefined &&
        (finalServices.length !== currentServices.length ||
            finalServices.some((s) => !currentServices.some((c) => c.service_id === s.serviceId)));
    // Si no se tocan los servicios, la duración es la que ya tenía la cita; si se reemplazan, la suma de los nuevos.
    const durationMs = data.serviceIds
        ? finalServices.reduce((sum, s) => sum + s.durationMinutesAtBooking, 0) * MS_PER_MINUTE
        : appointment.scheduled_end.getTime() - appointment.scheduled_start.getTime();
    const scheduledEnd = new Date(scheduledStart.getTime() + durationMs);

    if (startChanged) {
        // Ventana de reprogramación: desde que se agendó hasta 30 días después (días de calendario del negocio).
        // El piso lo cubre la disponibilidad (no acepta fechas pasadas); el techo se ancla en created_at, no en hoy.
        const bookedDayMs = Date.parse(`${getBusinessToday(appointment.created_at.getTime())}T00:00:00.000Z`);
        const newDayMs = Date.parse(`${getBusinessToday(scheduledStart.getTime())}T00:00:00.000Z`);
        if (newDayMs > bookedDayMs + RESCHEDULE_WINDOW_DAYS * MS_PER_DAY) {
            throw new ApiError(
                ApiErrorCode.INVALID_INPUT,
                `Appointments can only be rescheduled up to ${RESCHEDULE_WINDOW_DAYS} days after the booking date`
            );
        }
    }

    if (startChanged || barberChanged) {
        // Misma validación que al agendar, pero sin contar la cita que se edita como ocupada.
        const availability = await getAvailableSlots({
            shopId: appointment.shop_id,
            date: getBusinessToday(scheduledStart.getTime()),
            serviceIds: finalServices.map((s) => s.serviceId),
            excludeAppointmentId: appointment.id,
        });
        const barberSlots = availability.find((b) => b.barberId === barberId);
        if (!barberSlots) {
            throw new ApiError(ApiErrorCode.NOT_FOUND, 'Barber not found or is not accepting bookings at this shop');
        }
        if (!barberSlots.startTimes.includes(scheduledStart.toISOString())) {
            throw new ApiError(ApiErrorCode.CONFLICT, 'Selected time slot is not available');
        }
    } else if (servicesChanged) {
        // Mismo horario y barbero: el inicio original puede no caer en la rejilla de 15 min si las citas vecinas
        // cambiaron, así que no se exige; solo que la nueva duración no se salga del turno. Los traslapes los
        // valida la transacción con el candado del barbero.
        const shift = (await getAllShifts()).find((s) => s.id === barber.shift_id);
        const dayStartMs = Date.parse(`${getBusinessToday(scheduledStart.getTime())}T00:00:00.000Z`);
        const endMinutes = (toBusinessWallClockMs(scheduledEnd.getTime()) - dayStartMs) / MS_PER_MINUTE;
        if (!shift || endMinutes > timeToMinutes(shift.end_time)) {
            throw new ApiError(ApiErrorCode.CONFLICT, 'Selected services do not fit in the barber shift');
        }
    }

    const { appointment: updated, services } = await updateAppointmentWithServices({
        appointmentId: appointment.id,
        barberId,
        scheduledStart,
        scheduledEnd,
        notes,
        status: startChanged || barberChanged ? 'rescheduled' : appointment.status,
        services: finalServices,
    });

    if (performer.role === 'client') {
        return toClientAppointmentResponse(updated, services);
    }

    const [client] = await getAppointmentClientsById(updated.client_id !== null ? [updated.client_id] : []);
    return toAppointmentResponse(updated, services, client ?? null);
};

/**
 * Rango de búsqueda por inicio programado. Sin from ni to: hoy 00:00 hasta el día 30 a las 23:59:59.999
 * (hora del negocio). Si falta solo uno, se completa: from = hoy 00:00; to = from + 30 días.
 */
const resolveWindow = (query: ListAppointmentsQuery): { from: Date; to: Date } => {
    const from = query.from ?? getBusinessDayStart(0);
    const to =
        query.to ??
        (query.from
            ? new Date(from.getTime() + DEFAULT_WINDOW_DAYS * MS_PER_DAY - 1)
            : new Date(getBusinessDayStart(DEFAULT_WINDOW_DAYS).getTime() - 1));

    if (to < from) {
        throw new ApiError(ApiErrorCode.BAD_REQUEST, 'to must not be before from');
    }
    if (to.getTime() - from.getTime() > MAX_WINDOW_DAYS * MS_PER_DAY) {
        throw new ApiError(ApiErrorCode.BAD_REQUEST, `Date range must not exceed ${MAX_WINDOW_DAYS} days`);
    }
    return { from, to };
};

/**
 * Lista citas según el rol:
 * - client: solo las propias; los filtros exclusivos del personal se ignoran.
 * - receptionist: las de su sucursal.
 * - manager: las de las sucursales que administra.
 * El alcance se resuelve aquí y se aplica en SQL; shopId fuera de alcance responde 403.
 */
export const listAppointments = async (
    query: ListAppointmentsQuery,
    token: string
): Promise<AppointmentResponse[] | ClientAppointmentResponse[]> => {
    const performer = await isUserSessionValid(token);
    const { from, to } = resolveWindow(query);

    const filters: AppointmentListFilters = { from, to, statuses: query.status };

    if (performer.role === 'client') {
        filters.clientId = performer.id;
    } else {
        let accessibleShopIds: string[];
        if (performer.role === 'receptionist') {
            const receptionist = await getReceptionistByUserId(performer.id);
            if (!receptionist) {
                throw new ApiError(ApiErrorCode.FORBIDDEN, 'Receptionist is not assigned to a shop');
            }
            accessibleShopIds = [receptionist.shop_id];
        } else {
            accessibleShopIds = await getShopIdsByManagerId(performer.id);
        }

        if (query.shopId !== undefined) {
            if (!canViewShopAppointments(query.shopId, accessibleShopIds)) {
                throw new ApiError(ApiErrorCode.FORBIDDEN, 'Not authorized to view appointments of this shop');
            }
            accessibleShopIds = [query.shopId];
        }

        filters.shopIds = accessibleShopIds;
        filters.clientId = query.clientId;
        filters.barberId = query.barberId;
        if (query.clientType !== undefined) {
            filters.isRegisteredClient = query.clientType === 'registered';
        }
    }

    const appointments = await getAppointments(filters);
    const services = await getServicesByAppointmentIds(appointments.map((a) => a.id));

    const servicesByAppointment = new Map<string, AppointmentService[]>();
    for (const service of services) {
        const list = servicesByAppointment.get(service.appointment_id) ?? [];
        list.push(service);
        servicesByAppointment.set(service.appointment_id, list);
    }

    if (performer.role === 'client') {
        return appointments.map((a) => toClientAppointmentResponse(a, servicesByAppointment.get(a.id) ?? []));
    }

    const clientIds = [...new Set(appointments.flatMap((a) => (a.client_id !== null ? [a.client_id] : [])))];
    const clients = await getAppointmentClientsById(clientIds);
    const clientsById = new Map(clients.map((c) => [c.id, c]));

    return appointments.map((a) =>
        toAppointmentResponse(
            a,
            servicesByAppointment.get(a.id) ?? [],
            a.client_id !== null ? (clientsById.get(a.client_id) ?? null) : null
        )
    );
};
