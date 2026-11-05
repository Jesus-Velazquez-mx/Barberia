import { ActiveStatusBadge } from '../common/ActiveStatusBadgeComponent';
import { Badge } from '../common/BadgeComponent';
import { DataTable, type DataTableColumn, type DataTableProps } from '../common/DataTableComponent';
import type { OfferedService } from '../../types/offeredService';
import { formatPrice } from '../../utils/appointmentUtils';
import { formatDuration } from '../../utils/offeredServiceUtils';

/* Fila de la tabla: el servicio con el nombre de su categoría ya resuelto. */
export interface OfferedServiceRow extends OfferedService {
  categoryName: string;
}

const COLUMNS: DataTableColumn<OfferedServiceRow>[] = [
  {
    key: 'name',
    header: 'Nombre',
    render: (service) => (
      <div className="min-w-0">
        <span className="font-semibold">{service.name}</span>
        {service.description ? (
          <p className="mt-0.5 max-w-xs truncate text-xs text-[var(--text)]" title={service.description}>
            {service.description}
          </p>
        ) : null}
      </div>
    )
  },
  { key: 'category', header: 'Categoría', render: (service) => <Badge>{service.categoryName}</Badge> },
  {
    key: 'duration',
    header: 'Duración',
    render: (service) => <span className="text-[var(--text)]">{formatDuration(service.durationMinutes)}</span>
  },
  {
    key: 'price',
    header: 'Precio',
    render: (service) => <span className="font-semibold text-[var(--accent)]">{formatPrice(service.price)}</span>
  },
  { key: 'status', header: 'Estado', render: (service) => <ActiveStatusBadge isActive={service.isActive} /> }
];

type OfferedServiceTableProps = Omit<DataTableProps<OfferedServiceRow>, 'columns' | 'getRowKey' | 'getRowLabel'>;

export function OfferedServiceTable(props: OfferedServiceTableProps) {
  return (
    <DataTable<OfferedServiceRow>
      columns={COLUMNS}
      getRowKey={(service) => service.id}
      getRowLabel={(service) => service.name}
      {...props}
    />
  );
}
