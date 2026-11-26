import { useState } from 'react';
import type { PerformanceMetrics } from '../../types/reportType';
import { SERVICE_OUTCOMES, formatShare, type ServiceOutcomeKey } from '../../utils/reportUtils';

/* Medidas en unidades del viewBox. */
const SIZE = 240;
const CENTER = SIZE / 2;
const RADIUS = 92;
const THICKNESS = 26;
const ACTIVE_THICKNESS = 34;
const SEGMENT_GAP = 3;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface OutcomeDonutProps {
  metrics: PerformanceMetrics;
  /* De quién son los servicios, para el nombre accesible. */
  subject: string;
}

/* Gráfica de pastel (dona) del resultado de los servicios. Al señalar un segmento o su leyenda, el centro muestra
   su detalle; sin nada señalado muestra el total. */
export function OutcomeDonut({ metrics, subject }: OutcomeDonutProps) {
  const [activeKey, setActiveKey] = useState<ServiceOutcomeKey | null>(null);

  const total = metrics.scheduledServices;
  // Un resultado en cero no se dibuja, así que tampoco puede quedar señalado al cambiar de barbero.
  const active = SERVICE_OUTCOMES.find((outcome) => outcome.key === activeKey && metrics[outcome.key] > 0);
  // Con un solo resultado el anillo va completo, sin separación.
  const gap = SERVICE_OUTCOMES.filter((outcome) => metrics[outcome.key] > 0).length > 1 ? SEGMENT_GAP : 0;

  const segments = SERVICE_OUTCOMES.map((outcome, index) => {
    const previous = SERVICE_OUTCOMES.slice(0, index).reduce((sum, item) => sum + metrics[item.key], 0);
    const arc = total === 0 ? 0 : (metrics[outcome.key] / total) * CIRCUMFERENCE;

    return {
      ...outcome,
      value: metrics[outcome.key],
      // Un segmento muy pequeño conserva un ancho mínimo visible.
      length: arc === 0 ? 0 : Math.max(arc - gap, 1.5),
      offset: total === 0 ? 0 : (previous / total) * CIRCUMFERENCE
    };
  });

  const summary = segments.map((segment) => `${segment.label.toLowerCase()} ${segment.value}`).join(', ');

  return (
    <div className="mx-auto grid max-w-3xl items-center gap-8 md:grid-cols-[13rem_1fr]">
      <div className="relative mx-auto w-full max-w-52">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label={`${subject}: ${total} servicios agendados; ${summary}.`}
          className="block w-full -rotate-90"
        >
          <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" strokeWidth={THICKNESS} className="stroke-white/5" />
          {segments.map((segment) => (
            <circle
              key={segment.key}
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={segment.color}
              strokeWidth={active?.key === segment.key ? ACTIVE_THICKNESS : THICKNESS}
              strokeDasharray={`${segment.length} ${CIRCUMFERENCE}`}
              strokeDashoffset={-segment.offset}
              onPointerEnter={() => setActiveKey(segment.key)}
              onPointerLeave={() => setActiveKey(null)}
              className={`cursor-pointer transition-all duration-500 ease-out motion-reduce:transition-none ${
                segment.value === 0 ? 'pointer-events-none opacity-0' : ''
              } ${active && active.key !== segment.key ? 'opacity-30' : ''}`}
              style={{ pointerEvents: segment.value === 0 ? 'none' : 'stroke' }}
            />
          ))}
        </svg>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"
        >
          <span className="text-4xl font-bold leading-none text-[var(--text-h)]">
            {active ? metrics[active.key] : total}
          </span>
          <span className="mt-1 text-sm text-[var(--text)]">{active ? active.label : 'agendados'}</span>
          {active && (
            <span className="mt-0.5 text-sm font-semibold text-[var(--text-h)]">
              {formatShare(metrics[active.key], total)}
            </span>
          )}
        </div>
      </div>

      <ul aria-label="Servicios por resultado" className="m-0 flex list-none flex-col gap-2 p-0">
        {segments.map((segment) => (
          <li key={segment.key}>
            <button
              type="button"
              disabled={segment.value === 0}
              onPointerEnter={() => setActiveKey(segment.key)}
              onPointerLeave={() => setActiveKey(null)}
              onFocus={() => setActiveKey(segment.key)}
              onBlur={() => setActiveKey(null)}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors disabled:opacity-50 ${
                active?.key === segment.key
                  ? 'border-white/20 bg-white/5'
                  : 'border-transparent bg-white/[0.02] enabled:hover:bg-white/5'
              }`}
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: segment.color }}
                aria-hidden="true"
              />
              <span className="flex-1 text-sm text-[var(--text-h)]">{segment.label}</span>
              <span className="text-base font-bold tabular-nums text-[var(--text-h)]">{segment.value}</span>
              <span className="w-16 text-right text-sm tabular-nums text-[var(--text)]">
                {formatShare(segment.value, total)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
