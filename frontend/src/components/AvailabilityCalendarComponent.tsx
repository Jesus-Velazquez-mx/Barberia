import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { DayAvailability, DayStatus } from '../types/availabilityType';

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

/* Colores del calendario. `cell` pinta el día y `swatch` el cuadrito de la leyenda.
   Los días pasados, fuera de la ventana de reserva e inhábiles usan el estilo `closed`. */
const STATUS_COLORS: Record<DayStatus, { cell: string; swatch: string }> = {
  // Paleta fría: turquesa (#2DB5A3) = disponible, rosa (#C4608F) = no disponible
  available: {
    cell: 'border-[#2DB5A3]/55 bg-[#2DB5A3]/20 text-[#8EE0D4]',
    swatch: 'border border-[#2DB5A3]/55 bg-[#2DB5A3]/20',
  },
  full: {
    cell: 'border-[#C4608F]/55 bg-[#C4608F]/20 text-[#E6A3C2]',
    swatch: 'border border-[#C4608F]/55 bg-[#C4608F]/20',
  },
  closed: {
    cell: 'border-dashed border-[#2c2c2c] bg-[repeating-linear-gradient(45deg,#0f0f0f_0_6px,#171717_6px_12px)] text-neutral-600',
    swatch:
      'border border-dashed border-[#3a3a3a] bg-[repeating-linear-gradient(45deg,#0f0f0f_0_6px,#171717_6px_12px)]',
  },
};

const SELECTED_COLORS = {
  cell: 'border-[var(--accent)] bg-[var(--accent)] text-[#141414]',
  swatch: 'bg-[var(--accent)]',
};

const LEGEND: { label: string; swatch: string }[] = [
  { label: 'Disponible', swatch: STATUS_COLORS.available.swatch },
  { label: 'No disponible', swatch: STATUS_COLORS.full.swatch },
  { label: 'Día inhábil', swatch: STATUS_COLORS.closed.swatch },
  { label: 'Seleccionado', swatch: SELECTED_COLORS.swatch },
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
          const status: DayStatus = isOutOfRange || !info ? 'closed' : info.status;
          const isClickable = status === 'available';
          const isSelected = isClickable && dateKey === selectedDate;
          const isToday = dateKey === today;
          const slotsCount = info?.slotsCount ?? 0;
          const dayLabel = new Date(year, month, day).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });

          const ariaStatus = isClickable
            ? `${slotsCount} horarios disponibles`
            : status === 'full'
              ? 'no disponible'
              : 'no reservable';

          return (
            <button
              key={dateKey}
              type="button"
              disabled={!isClickable}
              aria-pressed={isSelected}
              aria-label={`${dayLabel}${isToday ? ' (hoy)' : ''}, ${ariaStatus}`}
              onClick={() => onSelectDay(dateKey)}
              className={`relative flex min-h-16 flex-col items-start justify-between rounded-lg border p-1.5 text-left transition sm:min-h-20 sm:p-2 ${
                isSelected ? SELECTED_COLORS.cell : STATUS_COLORS[status].cell
              } ${isClickable ? 'cursor-pointer hover:ring-1 hover:ring-white/60' : 'cursor-not-allowed'}`}
            >
              <span className="text-sm font-semibold">{day}</span>
              {isClickable && (
                <span className="hidden text-xs opacity-80 sm:inline">
                  {slotsCount} {slotsCount === 1 ? 'horario' : 'horarios'}
                </span>
              )}
              {isToday && (
                <span
                  aria-hidden="true"
                  className={`absolute right-2 top-2 h-2 w-2 rounded-full ${
                    isSelected ? 'bg-[#141414]' : 'bg-[var(--accent)]'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {LEGEND.map(({ label, swatch }) => (
          <div key={label} className="flex items-center gap-2 text-sm text-[var(--text-h)]">
            <span className={`inline-block h-5 w-5 rounded-md ${swatch}`} aria-hidden="true" />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
