import { Badge } from './BadgeComponent';
import { DataTable, type DataTableColumn, type DataTableProps } from './DataTableComponent';
import type { StaffMember } from '../types/staffType';
import { formatPhone, joinFullName } from '../utils/personUtils';
import { STAFF_ROLE_LABELS } from '../utils/staffOptions';

const COLUMNS: DataTableColumn<StaffMember>[] = [
  {
    key: 'name',
    header: 'Nombre completo',
    render: (member) => <span className="font-semibold">{joinFullName(member)}</span>
  },
  { key: 'phone', header: 'Teléfono', render: (member) => formatPhone(member.phone) },
  {
    key: 'email',
    header: 'Correo electrónico',
    render: (member) => <span className="text-[var(--text)]">{member.email ?? '—'}</span>
  },
  { key: 'role', header: 'Rol', render: (member) => <Badge>{STAFF_ROLE_LABELS[member.role]}</Badge> }
];

type StaffTableProps = Omit<DataTableProps<StaffMember>, 'columns' | 'getRowKey' | 'getRowLabel'>;

export function StaffTable(props: StaffTableProps) {
  return (
    <DataTable<StaffMember> columns={COLUMNS} getRowKey={(member) => member.id} getRowLabel={joinFullName} {...props} />
  );
}
