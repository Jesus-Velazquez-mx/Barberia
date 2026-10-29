import { ActiveStatusBadge } from './ActiveStatusBadgeComponent';
import { DataTable, type DataTableColumn, type DataTableProps } from './DataTableComponent';
import type { ServiceCategory } from '../types/serviceCategoryType';

/* Fila de la tabla: la categoría con el conteo de sus servicios ya calculado. */
export interface ServiceCategoryRow extends ServiceCategory {
  activeServices: number;
  totalServices: number;
}

const COLUMNS: DataTableColumn<ServiceCategoryRow>[] = [
  {
    key: 'name',
    header: 'Nombre',
    render: (category) => <span className="font-semibold">{category.name}</span>
  },
  {
    key: 'description',
    header: 'Descripción',
    render: (category) => (
      <span className="block max-w-md truncate text-[var(--text)]" title={category.description ?? undefined}>
        {category.description ?? '—'}
      </span>
    )
  },
  {
    key: 'services',
    header: 'Servicios',
    render: (category) => (
      <span className="text-[var(--text)]" title={`${category.activeServices} activos de ${category.totalServices}`}>
        <span className="font-semibold text-[var(--text-h)]">{category.activeServices}</span> / {category.totalServices}{' '}
        activos
      </span>
    )
  },
  { key: 'status', header: 'Estado', render: (category) => <ActiveStatusBadge isActive={category.isActive} /> }
];

type ServiceCategoryTableProps = Omit<DataTableProps<ServiceCategoryRow>, 'columns' | 'getRowKey' | 'getRowLabel'>;

export function ServiceCategoryTable(props: ServiceCategoryTableProps) {
  return (
    <DataTable<ServiceCategoryRow>
      columns={COLUMNS}
      getRowKey={(category) => category.id}
      getRowLabel={(category) => category.name}
      {...props}
    />
  );
}
