import type { Barber } from '../types/entities/barber.interface.js';
import type { BarberResponse, PublicBarberResponse } from '../types/dto/barberResponse.interface.js';

export const toPublicBarberResponse = (barber: Barber): PublicBarberResponse => {
    return {
        id: barber.id,
        firstName: barber.first_name,
        lastName: barber.last_name,
        shopId: barber.shop_id,
        shiftId: barber.shift_id,
        bio: barber.bio,
    };
};

export const toBarberResponse = (barber: Barber): BarberResponse => {
    return {
        ...toPublicBarberResponse(barber),
        email: barber.email,
        phone: barber.phone,
        birthDate: barber.birth_date,
        gender: barber.gender,
        isAcceptingBookings: barber.is_accepting_bookings,
        deletedAt: barber.deleted_at,
        createdAt: barber.created_at,
        updatedAt: barber.updated_at,
    };
};
