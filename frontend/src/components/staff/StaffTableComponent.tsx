import { ActiveStatusBadge } from '../common/ActiveStatusBadgeComponent';
import { Badge } from '../common/BadgeComponent';
import { DataTable, type DataTableColumn, type DataTableProps } from '../common/DataTableComponent';
import type { StaffMember } from '../../types/staffType';
import { getGenderLabel } from '../../utils/genderOptions';
import { formatPhone, joinFullName } from '../../utils/personUtils';
import { STAFF_ROLE_LABELS } from '../../utils/staffOptions';

/* Fila de la tabla con los nombres de sucursal y turno ya resueltos. */
export interface StaffRow extends StaffMember {
  shopName: string;
  shiftLabel: string;
}

const COLUMNS: DataTableColumn<StaffRow>[] = [
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
  {
    key: 'gender',
    header: 'Género',
    render: (member) => <span className="text-[var(--text)]">{getGenderLabel(member.gender)}</span>
  },
  {
    key: 'shop',
    header: 'Sucursal',
    render: (member) => <span className="text-[var(--text)]">{member.shopName}</span>
  },
  {
    key: 'shift',
    header: 'Turno',
    render: (member) => <span className="whitespace-nowrap text-[var(--text)]">{member.shiftLabel}</span>
  },
  { key: 'role', header: 'Rol', render: (member) => <Badge>{STAFF_ROLE_LABELS[member.role]}</Badge> },
  { key: 'status', header: 'Estado', render: (member) => <ActiveStatusBadge isActive={member.isActive} /> }
];

type StaffTableProps = Omit<DataTableProps<StaffRow>, 'columns' | 'getRowKey' | 'getRowLabel'>;

export function StaffTable(props: StaffTableProps) {
  return (
    <DataTable<StaffRow> columns={COLUMNS} getRowKey={(member) => member.id} getRowLabel={joinFullName} {...props} />
  );
}
