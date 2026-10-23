import type { AppointmentStatus } from '../types/appointmentType';
import { STATUS_LABELS } from '../utils/appointmentUtils';

/* Mismos colores fríos del calendario de disponibilidad: turquesa y rosa; el dorado marca lo que cambió. */
const STATUS_STYLES: Record<AppointmentStatus, string> = {
  scheduled: 'border-[#2DB5A3]/55 bg-[#2DB5A3]/20 text-[#8EE0D4]',
  rescheduled: 'border-[var(--accent)]/55 bg-[var(--accent)]/15 text-[var(--accent)]',
  cancelled: 'border-[#C4608F]/55 bg-[#C4608F]/20 text-[#E6A3C2]'
};

interface AppointmentStatusBadgeProps {
  status: AppointmentStatus;
}

export function AppointmentStatusBadge({ status }: AppointmentStatusBadgeProps) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
