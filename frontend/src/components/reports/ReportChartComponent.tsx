import { useState } from 'react';
import { ChartPie, ChevronDown, Table2 } from 'lucide-react';
import type { BarberPerformance, PerformanceMetrics } from '../../types/reportType';
import { joinFullName } from '../../utils/personUtils';
import { SERVICE_OUTCOMES } from '../../utils/reportUtils';
import { OutcomeDonut } from './OutcomeDonutComponent';

const ALL_BARBERS = '';

type ChartView = 'chart' | 'table';

interface ReportChartProps {
  totals: PerformanceMetrics;
  barbers: BarberPerformance[];
}

interface ViewToggleProps {
  view: ChartView;
  onChange: (view: ChartView) => void;
}

function ViewToggle({ view, onChange }: ViewToggleProps) {
  const options = [
    { value: 'chart' as const, label: 'Gráfica', icon: <ChartPie size={14} aria-hidden="true" /> },
    { value: 'table' as const, label: 'Tabla', icon: <Table2 size={14} aria-hidden="true" /> }
  ];

  return (
    <div role="group" aria-label="Vista" className="flex rounded-lg border border-white/10 bg-[#262626] p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={view === option.value}
          onClick={() => onChange(option.value)}
          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
            view === option.value ? 'bg-[var(--accent)] text-black' : 'text-[var(--text-h)] hover:bg-white/5'
          }`}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}

interface BarberSelectProps {
  barbers: BarberPerformance[];
  value: string;
  onChange: (barberId: string) => void;
}

function BarberSelect({ barbers, value, onChange }: BarberSelectProps) {
  return (
    <div className="relative min-w-0">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Barbero que se muestra en la gráfica"
        className="h-10 w-full max-w-64 cursor-pointer appearance-none truncate rounded-lg border border-white/10 bg-[#262626] pl-3 pr-9 text-xs font-semibold text-[var(--text-h)] outline-none transition-colors hover:border-[var(--accent)]/60 focus-visible:border-[var(--accent)]"
      >
        <option value={ALL_BARBERS}>Todos los barberos</option>
        {barbers.map((barber) => (
          <option key={barber.barberId} value={barber.barberId}>
            {joinFullName(barber)}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text)]"
      />
    </div>
  );
}

/* Los mismos datos en números, con todos los barberos a la vez para compararlos. */
function OutcomeTable({ totals, barbers }: ReportChartProps) {
  const cellClasses = 'px-3 py-2.5 text-right tabular-nums';
  const headerClasses = 'px-3 py-2.5 text-right text-xs font-bold text-[var(--text-h)]';

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-sm text-[var(--text-h)]">
        <thead>
          <tr>
            <th scope="col" className={`${headerClasses} !text-left`}>
              Barbero
            </th>
            {SERVICE_OUTCOMES.map((outcome) => (
              <th key={outcome.key} scope="col" className={headerClasses}>
                {outcome.label}
              </th>
            ))}
            <th scope="col" className={headerClasses}>
              Agendados
            </th>
          </tr>
        </thead>
        <tbody>
          {barbers.map((barber) => (
            <tr key={barber.barberId} className="border-t border-white/5">
              <th scope="row" className="px-3 py-2.5 text-left font-normal">
                {joinFullName(barber)}
              </th>
              {SERVICE_OUTCOMES.map((outcome) => (
                <td key={outcome.key} className={cellClasses}>
                  {barber[outcome.key]}
                </td>
              ))}
              <td className={`${cellClasses} font-semibold`}>{barber.scheduledServices}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-white/15 font-semibold">
            <th scope="row" className="px-3 py-2.5 text-left font-semibold">
              Total
            </th>
            {SERVICE_OUTCOMES.map((outcome) => (
              <td key={outcome.key} className={cellClasses}>
                {totals[outcome.key]}
              </td>
            ))}
            <td className={cellClasses}>{totals.scheduledServices}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/* Resultado de los servicios agendados: explica de qué se compone el porcentaje de finalizados. */
export function ReportChart({ totals, barbers }: ReportChartProps) {
  const [view, setView] = useState<ChartView>('chart');
  const [barberId, setBarberId] = useState(ALL_BARBERS);

  // Sin servicios agendados no hay nada que graficar; esos barberos solo aparecen en la tabla.
  const chartBarbers = barbers.filter((barber) => barber.scheduledServices > 0);
  const selected = chartBarbers.find((barber) => barber.barberId === barberId);

  return (
    <section aria-labelledby="report-chart-title" className="rounded-xl border border-white/10 bg-[#1A1A1A] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2
            id="report-chart-title"
            className="m-0 font-sans text-base font-bold tracking-normal text-[var(--text-h)]"
          >
            ¿Qué pasó con los servicios agendados?
          </h2>
          <p className="mt-1 text-sm text-[var(--text)]">Servicios del periodo según su resultado.</p>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-3">
          {view === 'chart' && chartBarbers.length > 1 && (
            <BarberSelect barbers={chartBarbers} value={barberId} onChange={setBarberId} />
          )}
          <ViewToggle view={view} onChange={setView} />
        </div>
      </div>

      <div className="mt-6">
        {view === 'table' ? (
          <OutcomeTable totals={totals} barbers={barbers} />
        ) : (
          <OutcomeDonut
            metrics={selected ?? totals}
            subject={selected ? joinFullName(selected) : 'Todos los barberos evaluados'}
          />
        )}
      </div>
    </section>
  );
}
