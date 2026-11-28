import type { Appointment } from '../types/entities/appointment.interface.js';
import type { AppointmentService } from '../types/entities/appointmentService.interface.js';
import type {
    AppointmentClient,
    AppointmentResponse,
    ClientAppointmentResponse,
    RewardDiscountResponse,
} from '../types/dto/appointmentResponse.interface.js';

/** Servicio gratis de una cita de recompensa: el snapshot más barato; en empate, el de menor service_id. */
export const getRewardDiscount = (
    services: Pick<AppointmentService, 'service_id' | 'price_at_booking'>[]
): RewardDiscountResponse | null => {
    const [first, ...rest] = services;
    if (!first) return null;

    const cheapest = rest.reduce((best, s) => {
        const difference = s.price_at_booking - best.price_at_booking;
        return difference < 0 || (difference === 0 && s.service_id < best.service_id) ? s : best;
    }, first);

    return { serviceId: cheapest.service_id, amount: cheapest.price_at_booking };
};

/** Los montos se operan en centavos enteros: sumar pesos como punto flotante deja residuos (220.10000000000002). */
const toCents = (amount: number): number => Math.round(amount * 100);

export const toClientAppointmentResponse = (
    appointment: Appointment,
    services: AppointmentService[]
): ClientAppointmentResponse => {
    const rewardDiscount = appointment.is_reward_redemption ? getRewardDiscount(services) : null;
    const totalCents = services.reduce((sum, s) => sum + toCents(s.price_at_booking), 0);

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
        rewardDiscount,
        amountDue: (totalCents - toCents(rewardDiscount?.amount ?? 0)) / 100,
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
