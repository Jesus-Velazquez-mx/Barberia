import { useEffect, useRef, useState } from 'react';
import { Check, Funnel } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterMenuProps {
  /* Encabezado dentro del menú, p. ej. "Rol". */
  title: string;
  options: FilterOption[];
  value: string;
  /* Valor que representa "sin filtro"; mientras sea distinto, el botón muestra el indicador de filtro activo. */
  defaultValue: string;
  onChange: (value: string) => void;
  /* Texto del botón. Por defecto "Filtros"; se cambia cuando una página usa varios menús (p. ej. "Sucursal"). */
  label?: string;
}

export function FilterMenu({ title, options, value, defaultValue, onChange, label = 'Filtros' }: FilterMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isActive = value !== defaultValue;

  // Cierra con clic fuera o con Escape.
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="relative inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-[#262626] px-4 text-sm font-semibold text-[var(--text-h)] transition-colors hover:border-[var(--accent)]/60"
      >
        <Funnel size={16} aria-hidden="true" />
        {label}
        {isActive && (
          <span
            className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[var(--accent)]"
            aria-label="Filtro activo"
          />
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label={title}
          className="absolute right-0 top-full z-30 mt-2 w-56 rounded-xl border border-white/10 bg-[#1E1E1E] p-2 shadow-[var(--shadow)]"
        >
          <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-[var(--text)]">{title}</p>

          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-white/5 ${
                  isSelected ? 'font-semibold text-[var(--accent)]' : 'text-[var(--text-h)]'
                }`}
              >
                {option.label}
                {isSelected && <Check size={16} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
