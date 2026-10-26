export interface ReceptionistResponse {
    userId: string;
    shopId: string;
    shiftId: string;
}

/**
 * Perfil completo de un recepcionista para los endpoints de gestión (/receptionists).
 * ReceptionistResponse se conserva aparte porque se anida en el perfil de autenticación.
 */
export interface ReceptionistDetailResponse extends ReceptionistResponse {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    birthDate: Date;
    gender: string;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
