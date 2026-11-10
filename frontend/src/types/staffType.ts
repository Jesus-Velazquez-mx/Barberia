/* Personal del negocio que administra el manager (barberos y recepcionistas). */
export type StaffRole = 'barber' | 'receptionist';

export interface StaffMember {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    /* Formato YYYY-MM-DD. */
    birthDate: string;
    gender: string;
    role: StaffRole;
    shopId: string;
    shiftId: string;
    isActive: boolean;
}

/* Valores del formulario de alta/edición de personal. */
export interface StaffFormValues {
    /* El diseño pide un solo campo; se separa en nombre y apellido al enviar (ver personUtils). */
    fullName: string;
    phone: string;
    email: string;
    /* Formato dd/mm/aaaa en el formulario (ver utils/dateFormat). */
    birthDate: string;
    gender: string;
    role: StaffRole;
    shopId: string;
    shiftId: string;
    /* Solo aplica al dar de alta a un recepcionista (los barberos no inician sesión). */
    password: string;
}

/* Lo que se envía al servicio. */
export interface StaffPayload {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    /* Formato YYYY-MM-DD para la API. */
    birthDate: string;
    gender: string;
    role: StaffRole;
    shopId: string;
    shiftId: string;
    password?: string;
}
