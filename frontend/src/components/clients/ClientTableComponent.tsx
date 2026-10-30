import { DataTable, type DataTableColumn, type DataTableProps } from '../common/DataTableComponent';
import type { ClientRecord } from '../../types/clientType';
import { formatPhone, joinFullName } from '../../utils/personUtils';

const COLUMNS: DataTableColumn<ClientRecord>[] = [
  {
    key: 'name',
    header: 'Nombre completo',
    render: (client) => <span className="font-semibold">{joinFullName(client)}</span>
  },
  { key: 'phone', header: 'Teléfono', render: (client) => formatPhone(client.phone) },
  {
    key: 'email',
    header: 'Correo electrónico',
    render: (client) => <span className="text-[var(--text)]">{client.email}</span>
  },
  { key: 'services', header: 'Servicios', render: (client) => client.completedServicesCount }
];

type ClientTableProps = Omit<DataTableProps<ClientRecord>, 'columns' | 'getRowKey' | 'getRowLabel'>;

export function ClientTable(props: ClientTableProps) {
  return (
    <DataTable<ClientRecord>
      columns={COLUMNS}
      getRowKey={(client) => client.id}
      getRowLabel={joinFullName}
      {...props}
    />
  );
}
