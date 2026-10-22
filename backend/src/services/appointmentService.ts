import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import {
    createAppointmentWithServices,
    getAppointments,
    getServicesByAppointmentIds,
} from '../repositories/appointmentRepository.js';
import { getShopById, getShopIdsByManagerId } from '../repositories/shopRepository.js';
import { getBarberById } from '../repositories/barberRepository.js';
import { getClientByUserId } from '../repositories/clientRepository.js';
import { getReceptionistByUserId } from '../repositories/receptionistRepository.js';
import { getAvailableSlots, getBookableServices } from './availabilityService.js';
import { canCreateAppointment, canViewShopAppointments } from './userPermissions.js';
import { isUserSessionValid } from '../utils/userSession.js';
import { toAppointmentResponse } from '../utils/appointmentMapper.js';
import { getBusinessDayStart } from '../utils/businessTime.js';
import type { AppointmentListFilters } from '../repositories/appointmentRepository.js';
import type { AppointmentService } from '../types/entities/appointmentService.interface.js';
import type { CreateAppointmentRequest, ListAppointmentsQuery } from '../types/dto/appointmentRequest.interface.js';
import type { AppointmentResponse } from '../types/dto/appointmentResponse.interface.js';

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
): Promise<AppointmentResponse> => {
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
    const scheduledStart = new Date(data.scheduledStart);
    const startIso = scheduledStart.toISOString();
    const availability = await getAvailableSlots({
        shopId: shop.id,
        date: startIso.slice(0, 10),
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

    return toAppointmentResponse(appointment, bookedServices);
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
): Promise<AppointmentResponse[]> => {
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

    return appointments.map((a) => toAppointmentResponse(a, servicesByAppointment.get(a.id) ?? []));
};
