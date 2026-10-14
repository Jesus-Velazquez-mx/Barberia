import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getVisiblePages } from '../utils/listUtils';

export interface TablePaginationProps {
  from: number;
  to: number;
  total: number;
  /* Plural del elemento listado, p. ej. "Usuarios". */
  itemLabel: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const BASE_BUTTON =
  'flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md border px-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40';

export function TablePagination({
  from,
  to,
  total,
  itemLabel,
  currentPage,
  totalPages,
  onPageChange
}: TablePaginationProps) {
  const summary = total === 0 ? `Mostrando 0 ${itemLabel}.` : `Mostrando ${from} - ${to} de ${total} ${itemLabel}.`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-4">
      <p className="text-xs text-[var(--text)]">{summary}</p>

      <nav aria-label="Paginación" className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Página anterior"
          className={`${BASE_BUTTON} border-white/10 bg-transparent text-[var(--text)] hover:border-[var(--accent)]/60`}
        >
          <ChevronLeft size={14} />
        </button>

        {getVisiblePages(currentPage, totalPages).map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-label={`Página ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
            className={`${BASE_BUTTON} ${
              page === currentPage
                ? 'border-[var(--accent)] bg-[var(--accent)] text-black'
                : 'border-white/10 bg-transparent text-[var(--text-h)] hover:border-[var(--accent)]/60'
            }`}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Página siguiente"
          className={`${BASE_BUTTON} border-white/10 bg-transparent text-[var(--text)] hover:border-[var(--accent)]/60`}
        >
          <ChevronRight size={14} />
        </button>
      </nav>
    </div>
  );
}
