/**
 * Vista pública del barbero: lo que ven usuarios no registrados y clientes.
 */
export interface PublicBarberResponse {
    id: string;
    firstName: string;
    lastName: string;
    shopId: string;
    shiftId: string;
    bio: string | null;
}

/**
 * Vista completa del barbero: la que ve el personal (gerentes y recepcionistas).
 */
export interface BarberResponse extends PublicBarberResponse {
    email: string | null;
    phone: string | null;
    birthDate: Date;
    gender: string;
    isAcceptingBookings: boolean;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
