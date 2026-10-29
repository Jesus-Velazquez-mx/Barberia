interface ActiveStatusBadgeProps {
  isActive: boolean;
}

/* Estado de un registro con borrado lógico (is_active): Activo / Inactivo. */
export function ActiveStatusBadge({ isActive }: ActiveStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
        isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-[var(--text)]'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-[var(--text)]'}`}
        aria-hidden="true"
      />
      {isActive ? 'Activo' : 'Inactivo'}
    </span>
  );
}
