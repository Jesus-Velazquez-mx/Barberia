export const toBarberResponse = (barber: any) => {
    return {
        id: barber.id,
        firstName: barber.first_name,
        lastName: barber.last_name,
        email: barber.email,
        phone: barber.phone,
        shopId: barber.shop_id,
        shiftId: barber.shift_id,
        bio: barber.bio,
        isAcceptingBookings: barber.is_accepting_bookings,
        createdAt: barber.created_at,
        updatedAt: barber.updated_at,
    };
};