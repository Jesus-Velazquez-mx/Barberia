import type { Appointment } from '../types/entities/appointment.interface.js';
import type { AppointmentService } from '../types/entities/appointmentService.interface.js';
import type {
    AppointmentClient,
    AppointmentResponse,
    ClientAppointmentResponse,
} from '../types/dto/appointmentResponse.interface.js';

export const toClientAppointmentResponse = (
    appointment: Appointment,
    services: AppointmentService[]
): ClientAppointmentResponse => {
    return {
        id: appointment.id,
        shopId: appointment.shop_id,
        barberId: appointment.barber_id,
        status: appointment.status,
        scheduledStart: appointment.scheduled_start,
        scheduledEnd: appointment.scheduled_end,
        notes: appointment.notes,
        services: services.map((s) => ({
            serviceId: s.service_id,
            priceAtBooking: s.price_at_booking,
            durationMinutesAtBooking: s.duration_minutes_at_booking,
        })),
        createdAt: appointment.created_at,
        updatedAt: appointment.updated_at,
    };
};

export const toAppointmentResponse = (
    appointment: Appointment,
    services: AppointmentService[],
    client: AppointmentClient | null
): AppointmentResponse => {
    return {
        ...toClientAppointmentResponse(appointment, services),
        client,
        isRegisteredClient: appointment.is_registered_client,
        guestClientName: appointment.guest_client_name,
    };
};
