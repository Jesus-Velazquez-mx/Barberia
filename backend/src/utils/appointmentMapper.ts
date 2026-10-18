import type { Appointment } from '../types/entities/appointment.interface.js';
import type { AppointmentResponse } from '../types/dto/appointmentResponse.interface.js';

export const toAppointmentResponse = (appointment: Appointment): AppointmentResponse => {
    return {
        id: appointment.id,
        shopId: appointment.shop_id,
        barberId: appointment.barber_id,
        clientId: appointment.client_id,
        isRegisteredClient: appointment.is_registered_client,
        guestClientName: appointment.guest_client_name,
        status: appointment.status,
        scheduledStart: appointment.scheduled_start,
        scheduledEnd: appointment.scheduled_end,
        notes: appointment.notes,
        createdAt: appointment.created_at,
        updatedAt: appointment.updated_at,
    };
};
