
import type { AppointmentRecord } from '../types/appointmentType';
import type {
  BarberOption,
  EditableAppointment,
  LoadSlotsParams,
  ModalService,
  SlotsByBarber,
  UpdatePayload
} from '../components/appointments/EditAppointmentModalComponent';

/* ------------------------------------------------------------------ */
/* Catálogo y barberos                                                */
/* ------------------------------------------------------------------ */

export const MOCK_CATALOG: ModalService[] = [
  { serviceId: 'svc-full-color', name: 'Full Color', durationMinutes: 90, price: 450 },
  { serviceId: 'svc-hot-towel', name: 'Hot Towel Shave', durationMinutes: 30, price: 180 },
  { serviceId: 'svc-classic-haircut', name: 'Classic Haircut', durationMinutes: 30, price: 150 },
  { serviceId: 'svc-beard-trim', name: 'Beard Trim', durationMinutes: 20, price: 100 },
  { serviceId: 'svc-skin-fade', name: 'Skin Fade', durationMinutes: 45, price: 200 }
];

export const MOCK_BARBERS: BarberOption[] = [
  { id: 'barber-1', name: 'Cristian' },
  { id: 'barber-2', name: 'Jose' },
  { id: 'barber-3', name: 'Pablo' }
];

/* ------------------------------------------------------------------ */
/* Utilidades internas                                                */
/* ------------------------------------------------------------------ */

// Offset fijo solo para el mock. Los componentes reales usan Intl con la zona del negocio.
const OFFSET = '-07:00';
const MS_PER_MIN = 60_000;
const MS_PER_HOUR = 60 * MS_PER_MIN;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const businessDate = (ms: number): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mazatlan',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(ms));

/* ------------------------------------------------------------------ */
/* Cita de ejemplo (siempre relativa a "ahora", para que no caduque)  */
/* ------------------------------------------------------------------ */

export type MockScenario = 'normal' | 'soon' | 'completed';

/**
 * normal    -> mañana a las 11:15 (editable por cualquier rol)
 * soon      -> empieza en 5 h (el cliente queda bloqueado por la regla de 8 h; el personal sí puede editar)
 * completed -> estado 'completed' (bloqueado para todos)
 */
export const createMockAppointment = (scenario: MockScenario = 'normal'): EditableAppointment => {
  const now = Date.now();
  const services = MOCK_CATALOG.filter((s) =>
    ['svc-full-color', 'svc-hot-towel', 'svc-classic-haircut'].includes(s.serviceId)
  );
  const duration = services.reduce((sum, s) => sum + s.durationMinutes, 0); // 150 min

  const startMs =
    scenario === 'soon'
      ? now + 5 * MS_PER_HOUR
      : new Date(`${businessDate(now + 24 * MS_PER_HOUR)}T11:15:00${OFFSET}`).getTime();

  return {
    id: '84f3eec4-7a1b-4c52-9d0e-3f6a2b8c1d90',
    clientId: 'client-asuka',
    shopId: 'shop-1',
    shopName: 'Barberia',
    barberId: 'barber-1',
    barberName: 'Cristian',
    status: scenario === 'completed' ? 'completed' : 'scheduled',
    scheduledStart: new Date(startMs).toISOString(),
    scheduledEnd: new Date(startMs + duration * MS_PER_MIN).toISOString(),
    originalScheduledStart: new Date(startMs).toISOString(),
    checkedInAt: null,
    completedAt: null,
    createdAt: new Date(now - MS_PER_HOUR).toISOString(),
    updatedAt: new Date(now - MS_PER_HOUR).toISOString(),
    cancelledAt: null,
    cancellationReason: null,
    notes: null,
    isRewardRedemption: false,
    clientName: 'Juan Pérez',
    clientEmail: 'juan.perez@gmail.com',
    isRegisteredClient: true,
    services: services.map((s) => ({
      serviceId: s.serviceId,
      name: s.name,
      priceAtBooking: s.price,
      durationMinutesAtBooking: s.durationMinutes
    }))
  };
};

/**
 * Adapta una cita real (AppointmentRecord) a los ids del mock, para que el barbero y los servicios
 * coincidan con MOCK_BARBERS y MOCK_CATALOG. Se elimina al conectar la API real.
 */
export const toMockEditable = (record: AppointmentRecord): EditableAppointment => {
  const barber = MOCK_BARBERS.find((b) => b.name === record.barberName) ?? MOCK_BARBERS[0];
  return {
    ...record,
    shopId: 'shop-1',
    barberId: barber.id,
    services: record.services.map((svc) => {
      const match = MOCK_CATALOG.find((c) => c.name === svc.name);
      return match ? { ...svc, serviceId: match.serviceId } : svc;
    })
  };
};

/* ------------------------------------------------------------------ */
/* API simulada                                                       */
/* ------------------------------------------------------------------ */

const OPEN_MIN = 9 * 60; // 09:00
const CLOSE_MIN = 19 * 60; // 19:00
const STEP_MIN = 15;

// Bloques ocupados por otras citas (minutos desde medianoche), por barbero.
const BUSY: Record<string, [number, number][]> = {
  'barber-shinji': [[13 * 60, 14 * 60]],
  'barber-kaji': [[10 * 60, 12 * 60]],
  'barber-kaworu': [[15 * 60, 17 * 60]]
};

const toIso = (date: string, minutes: number): string => {
  const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mm = String(minutes % 60).padStart(2, '0');
  return new Date(`${date}T${hh}:${mm}:00${OFFSET}`).toISOString();
};

/**
 * Simula GET /shops/:id/availability. Domingo cerrado, 09:00-19:00 cada 15 min,
 * sin horarios pasados ni traslapes. La propia cita se considera libre (excludeAppointmentId).
 */
export const mockLoadSlots = async ({ date, serviceIds }: LoadSlotsParams): Promise<SlotsByBarber[]> => {
  await sleep(400);

  const duration = serviceIds.reduce(
    (sum, id) => sum + (MOCK_CATALOG.find((s) => s.serviceId === id)?.durationMinutes ?? 0),
    0
  );
  const isSunday = new Date(`${date}T00:00:00Z`).getUTCDay() === 0;
  const now = Date.now();

  return MOCK_BARBERS.map((barber) => {
    const startTimes: string[] = [];
    if (!isSunday && duration > 0) {
      for (let start = OPEN_MIN; start + duration <= CLOSE_MIN; start += STEP_MIN) {
        const overlaps = (BUSY[barber.id] ?? []).some(([from, to]) => start < to && start + duration > from);
        const iso = toIso(date, start);
        if (!overlaps && Date.parse(iso) > now) startTimes.push(iso);
      }
    }
    return { barberId: barber.id, startTimes };
  });
};

/**
 * Simula PATCH /appointments/:id.
 * Para probar el estado de error, elige un horario que empiece a las 16:00:
 * lanza un CONFLICT como si otro cliente hubiera tomado el lugar.
 */
export const mockUpdateAppointment = async (appointmentId: string, payload: UpdatePayload): Promise<void> => {
  await sleep(600);
  console.log('[mock] PATCH /appointments/' + appointmentId, payload);

  if (payload.scheduledStart) {
    const hour = new Intl.DateTimeFormat('es-MX', {
      timeZone: 'America/Mazatlan',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date(payload.scheduledStart));
    if (hour === '16:00') throw new Error('Ese horario ya no está disponible. Elige otro.');
  }
};

/**
 * Simula la cancelación de una cita.
 * Para probar el estado de error, escribe un motivo que contenga la palabra "error".
 */
export const mockCancelAppointment = async (appointmentId: string, payload: { reason?: string }): Promise<void> => {
  await sleep(600);
  console.log('[mock] cancel /appointments/' + appointmentId, payload);

  if (payload.reason?.toLowerCase().includes('error')) {
    throw new Error('No se pudo cancelar la cita. Intenta de nuevo.');
  }
};
