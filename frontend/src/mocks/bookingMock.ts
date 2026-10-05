// Datos mock SOLO para la UI de selección (sin backend).
// Se elimina cuando exista el contenedor real del flujo de reserva.
import type { SelectOption } from '../components/SelectFieldComponent';
import type { AvailableSlot } from '../types/availabilityType';

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

/* ---------- Disponibilidad (mock) ---------- */

export type MockScenario = 'data' | 'loading' | 'empty' | 'error';

/* Solo para demo: fuerza el estado que muestra el modal de horarios */
export const MOCK_SCENARIOS: SelectOption[] = [
  { value: 'data', label: 'Con horarios' },
  { value: 'loading', label: 'Cargando' },
  { value: 'empty', label: 'Vacío' },
  { value: 'error', label: 'Error' },
];

export const MOCK_SCENARIO_ERROR = 'No se pudieron cargar los horarios. Intenta de nuevo más tarde.';

const MOCK_BARBERS = [
  { id: 'barber-1', name: 'Carlos Ramírez' },
  { id: 'barber-2', name: 'Miguel Torres' },
  { id: 'barber-3', name: 'Luis Herrera' },
];

// 09:00 a 19:00 cada 30 min
const SLOT_TIMES = Array.from({ length: 21 }, (_, i) => {
  const minutes = 9 * 60 + i * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
});

const hashString = (value: string): number => {
  let hash = 0;
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash;
};

/* Genera horarios de forma determinista según sucursal/servicios/fecha, para que
   el calendario muestre días con distinta disponibilidad. Domingos cerrado.
   Más servicios en la cita = más tiempo requerido = menos horarios libres. */
export function buildMockSlots(shopId: string, serviceIds: string[], date: string): AvailableSlot[] {
  if (new Date(`${date}T00:00:00`).getDay() === 0) return [];

  const seed = hashString(`${shopId}|${[...serviceIds].sort().join(',')}|${date}`);
  const total = SLOT_TIMES.length * MOCK_BARBERS.length;
  const count = Math.floor((seed % 25) / Math.max(serviceIds.length, 1));
  const offset = (seed >>> 3) % total;

  // El paso 5 es coprimo con 63, así que no se repiten índices
  const picked = new Set<number>();
  for (let k = 0; k < count; k++) picked.add((offset + k * 5) % total);

  return [...picked]
    .sort((a, b) => a - b)
    .map((index) => {
      const barber = MOCK_BARBERS[index % MOCK_BARBERS.length];
      return {
        barberId: barber.id,
        barberName: barber.name,
        startTime: `${date}T${SLOT_TIMES[Math.floor(index / MOCK_BARBERS.length)]}:00`,
      };
    });
}
