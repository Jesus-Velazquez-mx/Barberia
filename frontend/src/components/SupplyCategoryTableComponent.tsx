import { DataTable, type DataTableColumn, type DataTableProps } from './DataTableComponent';
import type { SupplyCategory } from '../types/supplyCategoryType';

const COLUMNS: DataTableColumn<SupplyCategory>[] = [
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
  }
];

type SupplyCategoryTableProps = Omit<DataTableProps<SupplyCategory>, 'columns' | 'getRowKey' | 'getRowLabel'>;

export function SupplyCategoryTable(props: SupplyCategoryTableProps) {
  return (
    <DataTable<SupplyCategory>
      columns={COLUMNS}
      getRowKey={(category) => category.id}
      getRowLabel={(category) => category.name}
      {...props}
    />
  );
}
