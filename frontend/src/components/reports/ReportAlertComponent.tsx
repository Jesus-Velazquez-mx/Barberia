import { AlertCircle, RotateCw } from 'lucide-react';

interface ReportAlertProps {
  message: string;
  /* Si se pasa, muestra el botón "Reintentar". */
  onRetry?: () => void;
}

export function ReportAlert({ message, onRetry }: ReportAlertProps) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#ff4d4d]/40 bg-[#ff4d4d]/10 px-4 py-3 text-sm font-medium text-[#ffb3b3]"
    >
      <div className="flex items-center gap-2.5">
        <AlertCircle size={18} className="shrink-0 text-[#ff4d4d]" aria-hidden="true" />
        <span>{message}</span>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-[#262626] px-3 py-1.5 text-xs font-semibold text-[var(--text-h)] transition-colors hover:border-[var(--accent)]/60"
        >
          <RotateCw size={14} aria-hidden="true" />
          Reintentar
        </button>
      )}
    </div>
  );
}
