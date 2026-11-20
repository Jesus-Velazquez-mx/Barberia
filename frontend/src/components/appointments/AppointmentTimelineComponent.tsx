import type { AppointmentRecord, AppointmentStatus } from '../../types/appointmentType';
import { formatAppointmentDateTime } from '../../utils/appointmentUtils';

/* Línea de tiempo (seguimiento) de una cita, compartida por el modal del personal y el detalle del cliente. */

interface TimelineEvent {
  key: string;
  title: string;
  /* Instante ISO del evento. */
  at: string;
  detail?: string;
  /* Color del punto; el último evento toma el color del estado actual. */
  status?: AppointmentStatus;
}

const DOT_COLORS: Record<AppointmentStatus, string> = {
  scheduled: 'bg-[#2DB5A3]',
  rescheduled: 'bg-[var(--accent)]',
  checkedIn: 'bg-[#5A9BCF]',
  completed: 'bg-[#6DBB8A]',
  cancelled: 'bg-[#C4608F]',
  noShow: 'bg-[#B86B5E]'
};

/* Eventos en orden cronológico: lo más reciente (lo más relevante) queda al final y resaltado. */
function buildTimeline(appointment: AppointmentRecord): TimelineEvent[] {
  const events: TimelineEvent[] = [
    {
      key: 'scheduled',
      title: appointment.isWalkIn ? 'Walk-in registrado' : 'Cita agendada',
      at: appointment.createdAt,
      status: 'scheduled'
    }
  ];

  if (appointment.status === 'rescheduled' && appointment.originalScheduledStart) {
    events.push({
      key: 'rescheduled',
      title: 'Cita reagendada',
      at: appointment.updatedAt,
      detail: `Fecha original: ${formatAppointmentDateTime(appointment.originalScheduledStart)}`,
      status: 'rescheduled'
    });
  }

  if (appointment.checkedInAt || appointment.status === 'checkedIn') {
    events.push({
      key: 'checkedIn',
      title: 'Check-in registrado',
      at: appointment.checkedInAt ?? appointment.scheduledStart,
      detail: appointment.isWalkIn ? 'Check-in automático (Walk-in)' : undefined,
      status: 'checkedIn'
    });
  }

  if (appointment.status === 'noShow') {
    events.push({
      key: 'noShow',
      title: 'Cliente ausente',
      at: appointment.scheduledStart,
      detail: 'El cliente no se presentó',
      status: 'noShow'
    });
  }

  if (appointment.status === 'cancelled') {
    events.push({
      key: 'cancelled',
      title: 'Cita cancelada',
      at: appointment.cancelledAt ?? appointment.updatedAt,
      detail: appointment.cancellationReason ?? undefined,
      status: 'cancelled'
    });
  }

  if (appointment.status === 'completed') {
    events.push({
      key: 'completed',
      title: 'Cita completada',
      at: appointment.completedAt ?? appointment.scheduledEnd,
      status: 'completed'
    });
  }

  return events;
}

export function AppointmentTimeline({ appointment }: { appointment: AppointmentRecord }) {
  const events = buildTimeline(appointment);

  return (
    <ol className="m-0 list-none p-0">
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        const dotColor = event.status ? DOT_COLORS[event.status] : 'bg-[var(--text)]';

        return (
          <li key={event.key} className="relative flex gap-3 pb-4 last:pb-0">
            {/* Línea que une un punto con el siguiente. */}
            {!isLast && <span aria-hidden="true" className="absolute left-[5px] top-4 bottom-0 w-px bg-white/15" />}
            <span
              aria-hidden="true"
              className={`relative mt-1 h-[11px] w-[11px] shrink-0 rounded-full ${dotColor} ${
                isLast && event.status ? 'ring-4 ring-white/10' : ''
              }`}
            />
            <div className="min-w-0">
              <span className="block text-sm font-semibold text-[var(--text-h)]">{event.title}</span>
              <span className="block text-xs text-[var(--text)]">{formatAppointmentDateTime(event.at)}</span>
              {event.detail && <span className="mt-1 block text-sm text-[var(--text-h)]">{event.detail}</span>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
