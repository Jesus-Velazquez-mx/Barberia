import { Badge } from './BadgeComponent';
import { DataTable, type DataTableColumn, type DataTableProps } from './DataTableComponent';
import type { Supply } from '../types/supplyType';

/* Fila de la tabla: el insumo con los nombres de su categoría y sucursal ya resueltos. */
export interface SupplyRow extends Supply {
  categoryName: string;
  shopName: string;
}

const COLUMNS: DataTableColumn<SupplyRow>[] = [
  {
    key: 'name',
    header: 'Nombre',
    render: (supply) => (
      <div className="min-w-0">
        <span className="font-semibold">{supply.name}</span>
        {supply.description ? (
          <p className="mt-0.5 max-w-xs truncate text-xs text-[var(--text)]" title={supply.description}>
            {supply.description}
          </p>
        ) : null}
      </div>
    )
  },
  {
    key: 'sku',
    header: 'SKU',
    render: (supply) => <span className="text-[var(--text)]">{supply.sku ?? '—'}</span>
  },
  { key: 'category', header: 'Categoría', render: (supply) => <Badge>{supply.categoryName}</Badge> },
  { key: 'shop', header: 'Sucursal', render: (supply) => supply.shopName },
  { key: 'unit', header: 'Unidad', render: (supply) => <span className="text-[var(--text)]">{supply.unit}</span> }
];

type SupplyTableProps = Omit<DataTableProps<SupplyRow>, 'columns' | 'getRowKey' | 'getRowLabel'>;

export function SupplyTable(props: SupplyTableProps) {
  return (
    <DataTable<SupplyRow>
      columns={COLUMNS}
      getRowKey={(supply) => supply.id}
      getRowLabel={(supply) => supply.name}
      {...props}
    />
  );
}
