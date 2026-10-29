/* Límites de las columnas de la tabla shops. */
export const SHOP_NAME_MAX = 50;
export const SHOP_STREET_MAX = 50;
export const SHOP_NUMBER_MAX = 4;

export const POSTAL_CODE_PATTERN = /^\d{5}$/;
/* Letras, dígitos, guion y diagonal: 123, 12A, 5-B, S/N. */
export const SHOP_NUMBER_PATTERN = /^[A-Za-z0-9/-]{1,4}$/;

interface ShopAddressFields {
  street: string | null;
  number: string | null;
  postalCode: string | null;
}

/* "Av. Revolución 1250, C.P. 82000"; '—' si la sucursal no tiene dirección capturada. */
export const formatShopAddress = (shop: ShopAddressFields): string => {
  const streetLine = [shop.street, shop.number].filter(Boolean).join(' ');
  const parts = [streetLine, shop.postalCode ? `C.P. ${shop.postalCode}` : ''].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : '—';
};
