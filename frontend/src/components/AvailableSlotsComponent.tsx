import { AlertCircle, CalendarX } from 'lucide-react';
import type { AvailableSlot } from '../types/availabilityType';
import { formatSlotTime } from '../utils/availabilityUtils';

interface AvailableSlotsProps {
  slots: AvailableSlot[];
  isLoading: boolean;
  error: string | null;
  selectedSlot?: AvailableSlot | null;
  onSelectSlot: (slot: AvailableSlot) => void;
}

const isSameSlot = (a: AvailableSlot, b?: AvailableSlot | null) =>
  !!b && a.barberId === b.barberId && a.startTime === b.startTime;

export function AvailableSlots({ slots, isLoading, error, selectedSlot, onSelectSlot }: AvailableSlotsProps) {
  if (isLoading) {
    return (
      <div aria-busy="true" aria-live="polite">
        <span className="sr-only">Cargando horarios…</span>
        <div className="grid grid-cols-3 gap-3" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-white/10" />
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
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-white/15 px-4 py-8 text-center">
        <CalendarX size={32} className="text-[var(--text)]" />
        <p className="m-0 font-semibold text-[var(--text-h)]">No hay horarios disponibles para esta fecha.</p>
        <p className="m-0 text-[var(--text)]">Prueba con otro día.</p>
      </div>
    );
  }

  return (
    <ul className="m-0 grid max-h-72 list-none grid-cols-3 gap-3 overflow-y-auto p-0">
      {slots.map((slot) => {
        const isSelected = isSameSlot(slot, selectedSlot);
        return (
          <li key={`${slot.barberId}-${slot.startTime}`}>
            <button
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelectSlot(slot)}
              className={`flex h-14 w-full cursor-pointer flex-col items-center justify-center rounded-lg border px-1 transition-colors ${
                isSelected
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-[#141414]'
                  : 'border-white/10 bg-[#121212] text-[var(--text-h)] hover:border-[var(--accent)]'
              }`}
            >
              <span className="font-semibold">{formatSlotTime(slot.startTime)}</span>
              <span className={`w-full truncate text-xs ${isSelected ? 'text-[#141414]' : 'text-[var(--text)]'}`}>
                {slot.barberName}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
