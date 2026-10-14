import type { ReactNode } from 'react';
import { Pencil, RotateCw, Trash2 } from 'lucide-react';
import { TablePagination, type TablePaginationProps } from './TablePaginationComponent';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
}

export interface DataTableProps<T> {
  /* Columnas de datos. Las columnas ID (al inicio) y ACCIONES (al final) las agrega la tabla. */
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  /* Nombre accesible de la fila, para los botones de acciones. */
  getRowLabel: (row: T) => string;
  /* Filas anteriores a esta página; la columna ID muestra la posición (#1, #2...). */
  startIndex: number;
  isLoading: boolean;
  error: string;
  emptyMessage: string;
  onRetry: () => void;
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
  pagination: TablePaginationProps;
}

const SKELETON_ROWS = 6;
const HEADER_CELL = 'px-5 py-4 text-xs font-bold uppercase tracking-wide text-[var(--text-h)]';

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  getRowLabel,
  startIndex,
  isLoading,
  error,
  emptyMessage,
  onRetry,
  onEdit,
  onDelete,
  pagination
}: DataTableProps<T>) {
  const columnCount = columns.length + 2;
  const hasRows = !isLoading && !error && rows.length > 0;

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#1A1A1A]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-[#222222]">
            <tr>
              <th scope="col" className={HEADER_CELL}>
                ID
              </th>
              {columns.map((column) => (
                <th key={column.key} scope="col" className={HEADER_CELL}>
                  {column.header}
                </th>
              ))}
              <th scope="col" className={HEADER_CELL}>
                Acciones
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
              rows.map((row, rowIndex) => {
                const label = getRowLabel(row);

                return (
                  <tr key={getRowKey(row)} className="border-t border-white/5 transition-colors hover:bg-white/[0.03]">
                    <td className="px-5 py-3 text-xs text-[var(--text)]">#{startIndex + rowIndex + 1}</td>
                    {columns.map((column) => (
                      <td key={column.key} className="px-5 py-3 text-[var(--text-h)]">
                        {column.render(row)}
                      </td>
                    ))}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(row)}
                          aria-label={`Editar a ${label}`}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/10"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(row)}
                          aria-label={`Eliminar a ${label}`}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-[#E53935] transition-colors hover:bg-[#E53935]/10"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {!isLoading && !error && <TablePagination {...pagination} />}
    </div>
  );
}
