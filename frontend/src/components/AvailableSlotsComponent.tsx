import { AlertCircle, CalendarX, ChevronDown } from 'lucide-react';
import { useState } from 'react';
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

interface BarberSlots {
  barberId: string;
  barberName: string;
  slots: AvailableSlot[];
}

/* Agrupa los horarios por barbero (en el orden en que aparece cada uno) y ordena cada grupo por hora. */
function groupSlotsByBarber(slots: AvailableSlot[]): BarberSlots[] {
  const groups = new Map<string, BarberSlots>();

  for (const slot of slots) {
    const group = groups.get(slot.barberId);
    if (group) group.slots.push(slot);
    else groups.set(slot.barberId, { barberId: slot.barberId, barberName: slot.barberName, slots: [slot] });
  }

  return [...groups.values()].map((group) => ({
    ...group,
    slots: [...group.slots].sort((a, b) => a.startTime.localeCompare(b.startTime))
  }));
}

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
        <CalendarX size={32} className="text-(--text)" />
        <p className="m-0 font-semibold text-(--text-h)">No hay horarios disponibles para esta fecha.</p>
        <p className="m-0 text-(--text)">Prueba con otro día.</p>
      </div>
    );
  }

  return (
    <div className="flex max-h-96 flex-col gap-4 overflow-y-auto">
      {groupSlotsByBarber(slots).map((group) => (
        <BarberSlotsSection
          key={group.barberId}
          group={group}
          selectedSlot={selectedSlot}
          onSelectSlot={onSelectSlot}
        />
      ))}
    </div>
  );
}

interface BarberSlotsSectionProps {
  group: BarberSlots;
  selectedSlot?: AvailableSlot | null;
  onSelectSlot: (slot: AvailableSlot) => void;
}

function BarberSlotsSection({ group, selectedSlot, onSelectSlot }: BarberSlotsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const slotsId = `barber-slots-${group.barberId}`;

  return (
    <section
      aria-label={`Horarios con ${group.barberName}`}
      className="rounded-xl border border-white/10 bg-[#161616] p-4"
    >
      <div className={`flex items-center gap-2 ${isExpanded ? 'mb-3' : ''}`}>
        <button
          type="button"
          aria-controls={slotsId}
          aria-expanded={isExpanded}
          aria-label={`${isExpanded ? 'Ocultar' : 'Mostrar'} horarios de ${group.barberName}`}
          onClick={() => setIsExpanded((expanded) => !expanded)}
          className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-(--text) transition-colors hover:bg-white/10 hover:text-(--text-h)"
        >
          <ChevronDown
            size={18}
            aria-hidden="true"
            className={`transition-transform ${isExpanded ? '' : '-rotate-90'}`}
          />
        </button>

        <h3 className="m-0 flex min-w-0 flex-1 items-center justify-between gap-2 font-sans text-base font-semibold text-(--text-h)">
          <span className="truncate">{group.barberName}</span>
          <span className="shrink-0 text-xs font-normal text-(--text)">
            {group.slots.length} {group.slots.length === 1 ? 'horario' : 'horarios'}
          </span>
        </h3>
      </div>

      {isExpanded && (
        <ul id={slotsId} className="m-0 grid list-none grid-cols-3 gap-2 p-0 sm:grid-cols-4">
          {group.slots.map((slot) => {
            const isSelected = isSameSlot(slot, selectedSlot);
            return (
              <li key={slot.startTime}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onSelectSlot(slot)}
                  className={`h-10 w-full cursor-pointer rounded-lg border font-semibold transition-colors ${
                    isSelected
                      ? 'border-(--accent) bg-(--accent) text-[#141414]'
                      : 'border-white/10 bg-[#121212] text-(--text-h) hover:border-(--accent)'
                  }`}
                >
                  {formatSlotTime(slot.startTime)}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
