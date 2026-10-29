
export interface Shop {
    id: string;
    name: string;
    street: string | null;
    postalCode: string | null;
    number: string | null;
    phone: string | null;
    managerId: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
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
