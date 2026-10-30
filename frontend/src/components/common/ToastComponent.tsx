import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface ToastProps {
  /* Vacío/null = no se muestra nada. */
  message: string | null;
  type?: 'success' | 'error';
  /* ms antes de autodesaparecer. */
  duration?: number;
  onDismiss: () => void;
}

export function Toast({ message, type = 'success', duration = 4000, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) return;

    // Un frame después de montar, para que la transición de entrada sí se anime.
    const showFrame = requestAnimationFrame(() => setVisible(true));

    const hideTimer = setTimeout(() => setVisible(false), duration);
    // Espera a que termine la transición de salida (300ms) antes de desmontar.
    const dismissTimer = setTimeout(onDismiss, duration + 300);

    return () => {
      cancelAnimationFrame(showFrame);
      clearTimeout(hideTimer);
      clearTimeout(dismissTimer);
    };
  }, [message, duration, onDismiss]);

  if (!message) return null;

  const isSuccess = type === 'success';

  return (
    <div
      className={`fixed right-6 top-6 z-[100] flex max-w-sm items-start gap-3 rounded-xl border bg-[#1E1E1E] p-4 shadow-[var(--shadow)] transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'
      } ${isSuccess ? 'border-emerald-500/40' : 'border-[#ff4d4d]/40'}`}
      role="status"
    >
      {isSuccess ? (
        <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-500" />
      ) : (
        <XCircle size={20} className="mt-0.5 shrink-0 text-[#ff4d4d]" />
      )}
      <p className="text-sm font-medium text-[var(--text-h)]">{message}</p>
    </div>
  );
}
