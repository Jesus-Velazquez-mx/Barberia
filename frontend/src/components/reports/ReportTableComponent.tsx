import { ActiveStatusBadge } from '../common/ActiveStatusBadgeComponent';
import { DataTable, type DataTableColumn, type DataTableProps } from '../common/DataTableComponent';
import type { BarberPerformance } from '../../types/reportType';
import { joinFullName } from '../../utils/personUtils';
import { formatPercentage } from '../../utils/reportUtils';
import { PercentageMeter } from './PercentageMeterComponent';

/* Cifra principal con su total agendado debajo. */
const renderCount = (completed: number, scheduledLabel: string) => (
  <>
    <span className="block font-semibold tabular-nums">{completed}</span>
    <span className="block whitespace-nowrap text-xs text-[var(--text)]">{scheduledLabel}</span>
  </>
);

const COLUMNS: DataTableColumn<BarberPerformance>[] = [
  {
    key: 'firstName',
    header: 'Nombre(s)',
    render: (barber) => (
      <span className="flex flex-col items-start gap-1">
        <span className="font-semibold">{barber.firstName}</span>
        {/* Un barbero dado de baja aparece si tuvo citas en el periodo. */}
        {!barber.isActive && <ActiveStatusBadge isActive={false} />}
      </span>
    )
  },
  {
    key: 'lastName',
    header: 'Apellido(s)',
    render: (barber) => <span className="font-semibold">{barber.lastName}</span>
  },
  {
    key: 'email',
    header: 'Correo electrónico',
    render: (barber) => <span className="text-[var(--text)]">{barber.email}</span>
  },
  {
    key: 'shop',
    header: 'Sucursal asignada',
    render: (barber) => <span className="text-[var(--text)]">{barber.assignedShopName}</span>
  },
  {
    key: 'appointments',
    header: 'Citas finalizadas',
    render: (barber) => renderCount(barber.completedAppointments, `de ${barber.scheduledAppointments} agendadas`)
  },
  {
    key: 'services',
    header: 'Servicios finalizados',
    render: (barber) => renderCount(barber.completedServices, `de ${barber.scheduledServices} agendados`)
  },
  {
    key: 'percentage',
    header: '% finalizados',
    render: (barber) => (
      <div className="min-w-24">
        <span className="mb-1.5 block whitespace-nowrap font-semibold tabular-nums">
          {formatPercentage(barber.completionPercentage)}
        </span>
        {barber.completionPercentage !== null && <PercentageMeter value={barber.completionPercentage} />}
      </div>
    )
  }
];

type ReportTableProps = Omit<DataTableProps<BarberPerformance>, 'columns' | 'getRowKey' | 'getRowLabel'>;

export function ReportTable(props: ReportTableProps) {
  return (
    <DataTable<BarberPerformance>
      columns={COLUMNS}
      getRowKey={(barber) => barber.barberId}
      getRowLabel={joinFullName}
      {...props}
    />
  );
}
