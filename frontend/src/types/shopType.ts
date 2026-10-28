/* Tipos de la vista de administración de sucursales (mock). Son independientes de types/shop.ts,
   que usa el flujo de agendar cita. Cuando haya API, esta vista puede pasar a usar Shop. */

export interface ShopRecord {
  id: string;
  name: string;
  street: string | null;
  /* Número exterior, hasta 4 caracteres (123, 12A, S/N). */
  number: string | null;
  /* 5 dígitos. */
  postalCode: string | null;
  /* 10 dígitos, sin formato. */
  phone: string | null;
  managerId: string;
  managerName: string;
  isActive: boolean;
}

/* Valores del formulario de alta y edición; '' significa "sin dato". */
export interface ShopFormValues {
  name: string;
  street: string;
  number: string;
  postalCode: string;
  phone: string;
  managerId: string;
}

export interface ShopPayload {
  name: string;
  street: string | null;
  number: string | null;
  postalCode: string | null;
  phone: string | null;
  managerId: string;
}