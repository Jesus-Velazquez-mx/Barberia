import { ArrowDown, ArrowUp, RotateCw, Star } from 'lucide-react';
import type { AppointmentRecord, SortDirection } from '../types/appointmentType';
import { formatAppointmentDate, formatAppointmentTime } from '../utils/appointmentUtils';
import { AppointmentStatusBadge } from './AppointmentStatusBadgeComponent';
import { TablePagination, type TablePaginationProps } from './TablePaginationComponent';

interface AppointmentTableProps {
  rows: AppointmentRecord[];
  /* Filas anteriores a esta página; la columna ID muestra la posición (#1, #2...). */
  startIndex: number;
  isLoading: boolean;
  error: string;
  emptyMessage: string;
  onRetry: () => void;
  /* Clic en la fila (o en el ojo) para abrir el detalle. */
  onSelect: (appointment: AppointmentRecord) => void;
  /* Orden de la columna "Fecha de servicio". */
  sortDirection: SortDirection;
  onToggleSort: () => void;
  pagination: TablePaginationProps;
  /* false en la vista del cliente: todas las citas son suyas. */
  showClientColumn?: boolean;
}

//const COLUMN_COUNT = 7;
const SKELETON_ROWS = 6;
const HEADER_CELL = 'px-5 py-4 text-xs font-bold uppercase tracking-wide text-[var(--text-h)]';

export function AppointmentTable({
  rows,
  startIndex,
  isLoading,
  error,
  emptyMessage,
  onRetry,
  onSelect,
  sortDirection,
  onToggleSort,
  pagination,
  showClientColumn = true
}: AppointmentTableProps) {
  const columnCount = showClientColumn ? 7 : 6;
  const hasRows = !isLoading && !error && rows.length > 0;
  const SortIcon = sortDirection === 'desc' ? ArrowDown : ArrowUp;

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#1A1A1A]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead className="bg-[#222222]">
            <tr>
              <th scope="col" className={HEADER_CELL}>
                ID
              </th>
              <th scope="col" className={HEADER_CELL} aria-sort={sortDirection === 'desc' ? 'descending' : 'ascending'}>
                <button
                  type="button"
                  onClick={onToggleSort}
                  aria-label={`Fecha de servicio, orden ${sortDirection === 'desc' ? 'descendente' : 'ascendente'}. Cambiar orden`}
                  className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap border-none bg-transparent p-0 text-xs font-bold uppercase tracking-wide text-[var(--accent)]"
                >
                  Fecha de servicio
                  <SortIcon size={14} aria-hidden="true" />
                </button>
              </th>
              {showClientColumn && (
                <th scope="col" className={HEADER_CELL}>
                  Cliente
                </th>
              )}
              <th scope="col" className={HEADER_CELL}>
                Servicios
              </th>
              <th scope="col" className={HEADER_CELL}>
                Barbero
              </th>
              <th scope="col" className={HEADER_CELL}>
                Creada
              </th>
              <th scope="col" className={HEADER_CELL}>
                Estado
              </th>
            </tr>
          </thead>

          <tbody>
            {isLoading &&
              Array.from({ length: SKELETON_ROWS }, (_, rowIndex) => (
                <tr key={rowIndex} className="border-t border-white/5" aria-hidden="true">
                  {Array.from({ length: columnCount }, (_, cellIndex) => (
                    <td key={cellIndex} className="px-5 py-4">
                      <div className="h-3.5 w-3/4 animate-pulse rounded bg-white/10" />
                    </td>
                  ))}
                </tr>
              ))}

            {!isLoading && error && (
              <tr className="border-t border-white/5">
                <td colSpan={columnCount} className="px-5 py-12 text-center">
                  <p className="text-sm font-semibold text-[#ff4d4d]" role="alert">
                    {error}
                  </p>
                  <button
                    type="button"
                    onClick={onRetry}
                    className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-[#262626] px-4 py-2 text-sm font-semibold text-[var(--text-h)] transition-colors hover:border-[var(--accent)]/60"
                  >
                    <RotateCw size={14} aria-hidden="true" />
                    Reintentar
                  </button>
                </td>
              </tr>
            )}

            {!isLoading && !error && rows.length === 0 && (
              <tr className="border-t border-white/5">
                <td colSpan={columnCount} className="px-5 py-12 text-center text-sm text-[var(--text)]">
                  {emptyMessage}
                </td>
              </tr>
            )}

            {hasRows &&
              rows.map((appointment, rowIndex) => (
                <tr
                  key={appointment.id}
                  onClick={() => onSelect(appointment)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onSelect(appointment);
                    }
                  }}
                  tabIndex={0}
                  //aria-label={`Ver detalle de la cita de ${appointment.clientName}, ${formatAppointmentDate(appointment.scheduledStart)}`}
                  aria-label={
                    showClientColumn
                      ? `Ver detalle de la cita de ${appointment.clientName}, ${formatAppointmentDate(appointment.scheduledStart)}`
                      : `Ver detalle de la cita del ${formatAppointmentDate(appointment.scheduledStart)}`
                  }
                  className="cursor-pointer border-t border-white/5 transition-colors hover:bg-white/[0.06] focus-visible:bg-white/[0.06] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--accent)]"
                >
                  <td className="px-5 py-3 text-xs text-[var(--text)]">#{startIndex + rowIndex + 1}</td>

                  <td className="whitespace-nowrap px-5 py-3">
                    <span className="block font-semibold text-[var(--text-h)]">
                      {formatAppointmentDate(appointment.scheduledStart)}
                    </span>
                    <span className="text-xs text-[var(--text)]">
                      {formatAppointmentTime(appointment.scheduledStart)} -{' '}
                      {formatAppointmentTime(appointment.scheduledEnd)}
                    </span>
                  </td>

                  {showClientColumn && (
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2 font-semibold text-[var(--text-h)]">
                        {appointment.clientName}
                        {!appointment.isRegisteredClient && (
                          <span className="rounded-full bg-[#2C2C2C] px-2 py-0.5 text-[0.65rem] font-semibold uppercase text-[var(--text)]">
                            Visitante
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-[var(--text)]">{appointment.clientEmail ?? 'Sin correo'}</span>
                    </td>
                  )}
                  <td className="max-w-[220px] px-5 py-3 text-[var(--text-h)]">
                    <span className="inline-flex items-center gap-1.5">
                      {appointment.services.map((service) => service.name).join(', ')}
                      {appointment.isRewardRedemption && (
                        <span title="Recompensa otorgada" className="inline-flex shrink-0 text-[var(--accent)]">
                          <Star size={14} fill="currentColor" role="img" aria-label="Recompensa otorgada" />
                        </span>
                      )}
                    </span>
                  </td>

                  <td className="px-5 py-3">
                    <span className="block text-[var(--text-h)]">{appointment.barberName}</span>
                    <span className="text-xs text-[var(--text)]">{appointment.shopName}</span>
                  </td>

                  <td className="whitespace-nowrap px-5 py-3 text-[var(--text)]">
                    {formatAppointmentDate(appointment.createdAt)}
                  </td>

                  <td className="px-5 py-3">
                    <AppointmentStatusBadge status={appointment.status} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {!isLoading && !error && <TablePagination {...pagination} />}
    </div>
  );
}