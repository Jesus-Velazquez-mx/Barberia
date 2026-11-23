import { AlertCircle, CalendarX, Clock } from 'lucide-react';
import type { AvailableSlot } from '../../types/availabilityType';
import { formatSlotTime } from '../../utils/availabilityUtils';
import { WalkInBadge } from './WalkInBadgeComponent';

interface NextSlotPickerProps {
  /* Próximo slot de hoy de cada barbero, ordenado por hora (el primero es el más próximo). */
  slots: AvailableSlot[];
  isLoading: boolean;
  error: string | null;
  selectedSlot: AvailableSlot | null;
  onSelectSlot: (slot: AvailableSlot) => void;
}

const isSameSlot = (a: AvailableSlot, b?: AvailableSlot | null) =>
  !!b && a.barberId === b.barberId && a.startTime === b.startTime;

/* Opciones de un servicio sin cita: una por barbero con su próximo horario de hoy.
   El staff comunica las opciones al cliente y selecciona la que éste elija. */
export function NextSlotPicker({ slots, isLoading, error, selectedSlot, onSelectSlot }: NextSlotPickerProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[#2c2c2c] bg-[#1a1a1a] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-2xl text-(--text-h)">Próximo horario de hoy</h2>
        <WalkInBadge />
      </div>
      <p className="m-0 text-sm text-(--text)">
        Comunica al cliente los barberos disponibles y selecciona la opción que elija. La cita pasará sola a &quot;en
        curso&quot; al llegar su hora.
      </p>

      <NextSlotOptions
        slots={slots}
        isLoading={isLoading}
        error={error}
        selectedSlot={selectedSlot}
        onSelectSlot={onSelectSlot}
      />
    </div>
  );
}

function NextSlotOptions({ slots, isLoading, error, selectedSlot, onSelectSlot }: NextSlotPickerProps) {
  if (isLoading) {
    return (
      <div aria-busy="true" aria-live="polite">
        <span className="sr-only">Buscando el próximo horario…</span>
        <div className="flex flex-col gap-3" aria-hidden="true">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-white/10" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="flex items-start gap-3 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-300"
      >
        <AlertCircle size={20} className="mt-0.5 shrink-0" />
        <p className="m-0">{error}</p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div
        role="status"
        className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-white/15 px-4 py-8 text-center"
      >
        <CalendarX size={32} className="text-(--text)" />
        <p className="m-0 font-semibold text-(--text-h)">No queda disponibilidad hoy para estos servicios.</p>
        <p className="m-0 text-(--text)">
          No es posible registrar el servicio sin cita. Ofrece al cliente agendar otro día.
        </p>
      </div>
    );
  }

  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {slots.map((slot, index) => {
        const isSelected = isSameSlot(slot, selectedSlot);
        return (
          <li key={`${slot.barberId}-${slot.startTime}`}>
            <button
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelectSlot(slot)}
              className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                isSelected
                  ? 'border-(--accent) bg-(--accent)/10'
                  : 'border-white/10 bg-[#121212] hover:border-(--accent)'
              }`}
            >
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold text-(--text-h)">{slot.barberName}</span>
                {index === 0 && <span className="text-xs font-semibold text-(--accent)">Más próximo</span>}
              </span>
              <span
                className={`flex shrink-0 items-center gap-1.5 font-semibold ${isSelected ? 'text-(--accent)' : 'text-(--text-h)'}`}
              >
                <Clock size={16} aria-hidden="true" />
                {formatSlotTime(slot.startTime)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
