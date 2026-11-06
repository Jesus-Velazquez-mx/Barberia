import type { Shop } from './shop';

export type { ShopPayload } from './shop';

/* Fila de la vista de administración de sucursales. El backend solo devuelve al manager sus propias
   sucursales, así que managerName es el nombre del manager con sesión iniciada. */
export interface ShopRecord extends Shop {
  managerName: string;
}

/* Valores del formulario de alta y edición; '' significa "sin dato". */
export interface ShopFormValues {
  name: string;
  street: string;
  number: string;
  postalCode: string;
  phone: string;
  /* SelectField trabaja con strings; se convierte a boolean al armar el payload. */
  isActive: 'true' | 'false';
}
