import type { AppointmentStatus } from '../../types/appointmentType';
import { STATUS_LABELS } from '../../utils/appointmentUtils';

/* Mismos colores fríos del calendario de disponibilidad: turquesa y rosa; el dorado marca lo que cambió. */
const STATUS_STYLES: Record<AppointmentStatus, string> = {
  scheduled: 'border-[#2DB5A3]/55 bg-[#2DB5A3]/20 text-[#8EE0D4]',
  rescheduled: 'border-[var(--accent)]/55 bg-[var(--accent)]/15 text-[var(--accent)]',
  checkedIn: 'border-[#5A9BCF]/55 bg-[#5A9BCF]/20 text-[#A9D4F0]',
  completed: 'border-[#6DBB8A]/55 bg-[#6DBB8A]/20 text-[#B4E2C3]',
  cancelled: 'border-[#C4608F]/55 bg-[#C4608F]/20 text-[#E6A3C2]',
  noShow: 'border-[#B86B5E]/55 bg-[#B86B5E]/20 text-[#E5B1A8]'
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
