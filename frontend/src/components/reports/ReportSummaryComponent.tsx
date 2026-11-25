import type { ReactNode } from 'react';
import type { BarberPerformanceReport } from '../../types/reportType';
import { isoToDisplayDate } from '../../utils/dateFormat';
import { formatPercentage } from '../../utils/reportUtils';
import { PercentageMeter } from './PercentageMeterComponent';

interface SummaryTileProps {
  label: string;
  value: string | number;
  /* Contexto bajo la cifra (p. ej. "de 32 agendados"). */
  children?: ReactNode;
}

function SummaryTile({ label, value, children }: SummaryTileProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#1A1A1A] p-5">
      <dt className="text-sm text-[var(--text)]">{label}</dt>
      <dd className="m-0 mt-1">
        <span className="block text-3xl font-bold leading-tight text-[var(--text-h)]">{value}</span>
        {children && <div className="mt-1 text-sm text-[var(--text)]">{children}</div>}
      </dd>
    </div>
  );
}

interface ReportSummaryProps {
  report: BarberPerformanceReport;
}

/* Encabezado del reporte (sucursal y periodo evaluados) e indicadores de todos los barberos evaluados. */
export function ReportSummary({ report }: ReportSummaryProps) {
  const { totals, barbers } = report;

  return (
    <section aria-label="Resumen del reporte">
      <h2 className="m-0 font-sans text-lg font-bold tracking-normal text-[var(--text-h)]">{report.shopName}</h2>
      <p className="mt-1 text-sm text-[var(--text)]">
        Del {isoToDisplayDate(report.startDate)} al {isoToDisplayDate(report.endDate)}
      </p>

      <dl className="m-0 mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryTile label="Servicios finalizados" value={totals.completedServices}>
          de {totals.scheduledServices} agendados
        </SummaryTile>

        <SummaryTile label="Porcentaje de servicios finalizados" value={formatPercentage(totals.completionPercentage)}>
          <div className="mt-3">
            <PercentageMeter value={totals.completionPercentage ?? 0} />
          </div>
        </SummaryTile>

        <SummaryTile label="Citas finalizadas" value={totals.completedAppointments}>
          de {totals.scheduledAppointments} agendadas
        </SummaryTile>

        <SummaryTile label="Barberos evaluados" value={barbers.length} />
      </dl>
    </section>
  );
}
