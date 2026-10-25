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
        isWalkIn: appointment.is_walk_in,
        status: appointment.status,
        originalScheduledStart: appointment.original_scheduled_start,
        scheduledStart: appointment.scheduled_start,
        scheduledEnd: appointment.scheduled_end,
        checkedInAt: appointment.checked_in_at,
        completedAt: appointment.completed_at,
        cancelledAt: appointment.cancelled_at,
        cancelationReason: appointment.cancellation_reason,
        notes: appointment.notes,
        isRewardRedemption: appointment.is_reward_redemption,
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
        clientEmail: appointment.client_email,
    };
};
