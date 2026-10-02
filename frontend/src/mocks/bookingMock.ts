// Datos mock SOLO para la UI de selección (sin backend).
// Se elimina cuando exista el contenedor real del flujo de reserva.
import type { SelectOption } from '../components/SelectFieldComponent';

export const MOCK_SHOPS: SelectOption[] = [
  { value: 'shop-1', label: 'Mr. Barber Sendero' },
  { value: 'shop-2', label: 'Mr. Barber Explanada' },
  { value: 'shop-3', label: 'Mr. Barber Ficticio' },
];

export const MOCK_SERVICES: SelectOption[] = [
  { value: 'svc-1', label: 'Corte clásico' },
  { value: 'svc-2', label: 'Afeitado de barba' },
  { value: 'svc-3', label: 'Tinte de cabello' },
];
