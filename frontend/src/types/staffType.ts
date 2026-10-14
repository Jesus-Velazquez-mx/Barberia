/* Personal del negocio que administra el manager (barberos y recepcionistas). */
export type StaffRole = 'barber' | 'receptionist';

export interface StaffMember {
    id: string;
    firstName: string;
    lastName: string;
    /* Los barberos no tienen cuenta de usuario: su correo es opcional. */
    email: string | null;
    phone: string | null;
    role: StaffRole;
    shopId: string;
    shiftId: string;
}

/* Valores del formulario de alta/edición de personal. */
export interface StaffFormValues {
    /* El diseño pide un solo campo; se separa en nombre y apellido al enviar (ver personUtils). */
    fullName: string;
    phone: string;
    email: string;
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
    email: string | null;
    phone: string;
    role: StaffRole;
    shopId: string;
    shiftId: string;
    password?: string;
}
