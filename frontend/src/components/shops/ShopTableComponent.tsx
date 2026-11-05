import { DataTable, type DataTableColumn, type DataTableProps } from '../common/DataTableComponent';
import { formatPhone } from '../../utils/personUtils';
import { formatShopAddress } from '../../utils/shopUtils';
import type { ShopRecord } from '../../types/shopType';

const COLUMNS: DataTableColumn<ShopRecord>[] = [
  {
    key: 'name',
    header: 'Sucursal',
    render: (shop) => <span className="font-semibold">{shop.name}</span>
  },
  {
    key: 'address',
    header: 'Dirección',
    render: (shop) => <span className="text-[var(--text)]">{formatShopAddress(shop)}</span>
  },
  {
    key: 'phone',
    header: 'Teléfono',
    render: (shop) => (shop.phone ? formatPhone(shop.phone) : <span className="text-[var(--text)]">—</span>)
  },
  {
    key: 'manager',
    header: 'Gerente',
    render: (shop) => shop.managerName
  }
];

type ShopTableProps = Omit<DataTableProps<ShopRecord>, 'columns' | 'getRowKey' | 'getRowLabel'>;

export function ShopTable(props: ShopTableProps) {
  return (
    <DataTable<ShopRecord> columns={COLUMNS} getRowKey={(shop) => shop.id} getRowLabel={(shop) => shop.name} {...props} />
  );
}