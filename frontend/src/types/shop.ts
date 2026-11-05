/* Coincide con la respuesta del backend (GET/POST/PUT /shops). */
export interface Shop {
    id: string;
    name: string;
    street: string | null;
    postalCode: string | null;
    number: string | null;
    phone: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

/* Cuerpo de POST/PUT /shops. No se envía managerId: el backend asigna la sucursal al manager del token. */
export interface ShopPayload {
    name: string;
    street: string | null;
    number: string | null;
    postalCode: string | null;
    phone: string | null;
    isActive: boolean;
}
