export interface OfferedService {
    id: string;
    categoryId: string;
    name: string;
    description: string | null;
    durationMinutes: number;
    price: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

/* Valores del formulario de alta/edición de servicios (los inputs trabajan con texto). */
export interface OfferedServiceFormValues {
    name: string;
    categoryId: string;
    durationMinutes: string;
    price: string;
    description: string;
    isActive: 'true' | 'false';
}

/* Lo que se envía al servicio (en el backend: POST /offeredServices y PUT /offeredServices/:id). */
export interface OfferedServicePayload {
    categoryId: string;
    name: string;
    description: string | null;
    durationMinutes: number;
    price: number;
    isActive: boolean;
}
