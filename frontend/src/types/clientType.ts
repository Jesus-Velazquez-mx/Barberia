/* Clientes registrados, tal como los administra el manager. */
export interface ClientRecord {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    completedServicesCount: number;
}

/* Valores del formulario de alta/edición de clientes. */
export interface ClientFormValues {
    /* El diseño pide un solo campo; se separa en nombre y apellido al enviar (ver personUtils). */
    fullName: string;
    phone: string;
    email: string;
}

/* Lo que se envía al servicio. */
export interface ClientPayload {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
}
