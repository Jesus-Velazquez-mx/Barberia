import { Eye } from 'lucide-react';

interface ReadOnlyNoticeProps {
  message: string;
}

/* Aviso para vistas en modo consulta (p. ej. la recepcionista puede ver pero no editar). */
export function ReadOnlyNotice({ message }: ReadOnlyNoticeProps) {
  return (
    <div
      role="note"
      className="mt-6 flex items-center gap-3 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-3 text-sm text-[var(--text-h)]"
    >
      <Eye size={18} aria-hidden="true" className="shrink-0 text-[var(--accent)]" />
      <span>{message}</span>
    </div>
  );
}
