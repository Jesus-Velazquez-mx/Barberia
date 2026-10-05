import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { AvailabilityLevel, DayAvailability } from '../types/availabilityType';

interface AvailabilityCalendarProps {
  year: number;
  /** 0-11 */
  month: number;
  /** YYYY-MM-DD */
  today: string;
  /** Último día reservable, YYYY-MM-DD */
  maxDate: string;
  availabilityByDate: Record<string, DayAvailability>;
  selectedDate: string | null;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDay: (date: string) => void;
}

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/* Paleta: oro a bronce. Alta = oro claro, media = dorado oscuro de la marca,
   baja = bronce tenue. `cell` pinta el día en el calendario y `swatch` el
   cuadrito de la leyenda. Para cambiar la paleta solo hay que editar este bloque. */
const LEVEL_COLORS: Record<AvailabilityLevel, { cell: string; swatch: string }> = {
  high: {
    cell: 'border-[#E6C77F] bg-[#E6C77F] text-[#141414]',
    swatch: 'border border-[#E6C77F] bg-[#E6C77F]',
  },
  medium: {
    cell: 'border-[#B8924A] bg-[#B8924A] text-[#141414]',
    swatch: 'border border-[#B8924A] bg-[#B8924A]',
  },
  low: {
    cell: 'border-[#8B652D]/70 bg-[#8B652D]/30 text-[#C99A52]',
    swatch: 'border border-[#8B652D]/70 bg-[#8B652D]/30',
  },
  none: {
    cell: 'border-[#4d4d4d] bg-[#1a1a1a] text-neutral-500',
    swatch: 'border border-[#4d4d4d] bg-[#1a1a1a]',
  },
};

const LEGEND: { level: AvailabilityLevel; label: string }[] = [
  { level: 'high', label: 'Alta disponibilidad' },
  { level: 'medium', label: 'Media disponibilidad' },
  { level: 'low', label: 'Baja disponibilidad' },
];

const pad = (value: number) => String(value).padStart(2, '0');

export function AvailabilityCalendar({
  year,
  month,
  today,
  maxDate,
  availabilityByDate,
  selectedDate,
  canGoPrev,
  canGoNext,
  onPrevMonth,
  onNextMonth,
  onSelectDay,
}: AvailabilityCalendarProps) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Semana que empieza en lunes
  const leadingBlanks = (new Date(year, month, 1).getDay() + 6) % 7;
  const monthName = new Date(year, month, 1).toLocaleDateString('es-MX', { month: 'long' });
  const monthTitle = `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)} - ${year}`;

  return (
    <div className="rounded-xl border border-[#2c2c2c] bg-[#1a1a1a] p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          aria-label="Mes anterior"
          disabled={!canGoPrev}
          onClick={onPrevMonth}
          className="cursor-pointer rounded-lg border border-white/10 bg-transparent p-2 text-[var(--text-h)] hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-white/10"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="m-0 text-2xl text-[var(--text-h)]">{monthTitle}</h2>
        <button
          type="button"
          aria-label="Mes siguiente"
          disabled={!canGoNext}
          onClick={onNextMonth}
          className="cursor-pointer rounded-lg border border-white/10 bg-transparent p-2 text-[var(--text-h)] hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-white/10"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {WEEKDAYS.map((weekday) => (
          <div key={weekday} className="pb-1 text-center text-xs font-semibold uppercase text-[var(--text)]">
            {weekday}
          </div>
        ))}

        {Array.from({ length: leadingBlanks }, (_, i) => (
          <div key={`blank-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dateKey = `${year}-${pad(month + 1)}-${pad(day)}`;
          const info = availabilityByDate[dateKey];
          const isOutOfRange = dateKey < today || dateKey > maxDate;
          const level: AvailabilityLevel = isOutOfRange || !info ? 'none' : info.level;
          const isDisabled = level === 'none';
          const isSelected = dateKey === selectedDate;
          const slotsCount = info?.slotsCount ?? 0;
          const dayLabel = new Date(year, month, day).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });

          return (
            <button
              key={dateKey}
              type="button"
              disabled={isDisabled}
              aria-pressed={isSelected}
              aria-label={isDisabled ? `${dayLabel}, sin disponibilidad` : `${dayLabel}, ${slotsCount} horarios disponibles`}
              onClick={() => onSelectDay(dateKey)}
              className={`flex min-h-16 flex-col items-start justify-between rounded-lg border p-1.5 text-left transition sm:min-h-20 sm:p-2 ${LEVEL_COLORS[level].cell} ${
                isDisabled ? 'cursor-not-allowed' : 'cursor-pointer hover:ring-1 hover:ring-white/60'
              } ${isOutOfRange ? 'opacity-40' : ''} ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1a1a1a]' : ''}`}
            >
              <span className={`text-sm font-semibold ${dateKey === today ? 'underline decoration-2 underline-offset-4' : ''}`}>{day}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {LEGEND.map(({ level, label }) => (
          <div key={level} className="flex items-center gap-2 text-sm text-[var(--text-h)]">
            <span className={`inline-block h-4 w-4 rounded-sm ${LEVEL_COLORS[level].swatch}`} aria-hidden="true" />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
