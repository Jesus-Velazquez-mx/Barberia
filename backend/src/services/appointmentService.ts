import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import { createAppointmentWithServices } from '../repositories/appointmentRepository.js';
import { getShopById } from '../repositories/shopRepository.js';
import { getClientByUserId } from '../repositories/clientRepository.js';
import { getReceptionistByUserId } from '../repositories/receptionistRepository.js';
import { getAvailableSlots, getBookableServices } from './availabilityService.js';
import { canCreateAppointment } from './userPermissions.js';
import { isUserSessionValid } from '../utils/userSession.js';
import { toAppointmentResponse } from '../utils/appointmentMapper.js';
import type { CreateAppointmentRequest } from '../types/dto/appointmentRequest.interface.js';
import type { AppointmentResponse } from '../types/dto/appointmentResponse.interface.js';

const MS_PER_MINUTE = 60_000;

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

    const shop = await getShopById(data.shopId);
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
    // servicios, barbero elegible, turno, plantilla semanal y citas existentes.
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
