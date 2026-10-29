import { DataTable, type DataTableColumn, type DataTableProps } from './DataTableComponent';
import { formatShiftDuration, formatShiftRange, getShiftDurationMinutes, getShiftLabel } from '../utils/shiftUtils';
import type { Shift } from '../types/shiftType';

const COLUMNS: DataTableColumn<Shift>[] = [
  {
    key: 'name',
    header: 'Turno',
    render: (shift) => <span className="font-semibold">{getShiftLabel(shift.name)}</span>
  },
  {
    key: 'schedule',
    header: 'Horario',
    render: (shift) => <span className="whitespace-nowrap">{formatShiftRange(shift.startTime, shift.endTime)}</span>
  },
  {
    key: 'duration',
    header: 'Duración',
    render: (shift) => (
      <span className="whitespace-nowrap text-[var(--text)]">
        {formatShiftDuration(getShiftDurationMinutes(shift.startTime, shift.endTime))}
      </span>
    )
  },

];

type ShiftTableProps = Omit<DataTableProps<Shift>, 'columns' | 'getRowKey' | 'getRowLabel'>;

export function ShiftTable(props: ShiftTableProps) {
  return (
    <DataTable<Shift>
      columns={COLUMNS}
      getRowKey={(shift) => shift.id}
      getRowLabel={(shift) => getShiftLabel(shift.name)}
      {...props}
    />
  );
}