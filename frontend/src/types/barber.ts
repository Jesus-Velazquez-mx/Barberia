/** Vista pública del barbero: la reciben usuarios no registrados y clientes. */
export interface PublicBarber {
    id: string;
    firstName: string;
    lastName: string;
    shopId: string;
    shiftId: string;
    bio: string | null;
}

/** Vista completa del barbero: solo la reciben el personal (gerentes y recepcionistas). */
export interface StaffBarber extends PublicBarber {
    email: string | null;
    phone: string | null;
    birthDate: string;
    gender: string;
    isAcceptingBookings: boolean;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
}
