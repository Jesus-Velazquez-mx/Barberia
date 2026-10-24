import type { ReactNode } from 'react';
import type { AppointmentRecord, AppointmentStatus } from '../types/appointmentType';
import {
  formatAppointmentDate,
  formatAppointmentDateTime,
  formatAppointmentTime,
  formatPrice,
  getAppointmentDuration,
  getAppointmentTotal
} from '../utils/appointmentUtils';

interface AppointmentDetailContentProps {
  appointment: AppointmentRecord;
  /* false en la vista del cliente: la cita ya es suya. */
  showClient?: boolean;
}

/* ---------- Piezas ---------- */

function InfoTile({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-white/10 bg-black/20 px-3.5 py-2.5 ${className}`}>
      <span className="block text-[0.7rem] font-semibold uppercase tracking-wide text-[var(--text)]">{label}</span>
      <div className="mt-0.5 text-sm font-semibold text-[var(--text-h)]">{children}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="m-0 mb-3 font-sans text-xs font-bold uppercase tracking-wide text-[var(--accent)]">{children}</h3>
  );
}

/* ---------- Línea de tiempo ---------- */

interface TimelineEvent {
  key: string;
  title: string;
  at: string;
  detail?: string;
  status?: AppointmentStatus;
}

/* Parcial: los estados sin color propio usan el punto gris. */
const DOT_COLORS: Partial<Record<AppointmentStatus, string>> = {
  scheduled: 'bg-[#2DB5A3]',
  rescheduled: 'bg-[var(--accent)]',
  cancelled: 'bg-[#C4608F]'
};

function buildTimeline(appointment: AppointmentRecord): TimelineEvent[] {
  const events: TimelineEvent[] = [{ key: 'created', title: 'Cita creada', at: appointment.createdAt }];

  if (appointment.status === 'rescheduled' && appointment.originalScheduledStart) {
    events.push({
      key: 'rescheduled',
      title: 'Cita reagendada',
      at: appointment.updatedAt,
      detail: `Fecha original: ${formatAppointmentDateTime(appointment.originalScheduledStart)}`,
      status: 'rescheduled'
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

  return events;
}

function Timeline({ appointment }: { appointment: AppointmentRecord }) {
  const events = buildTimeline(appointment);

  return (
    <ol className="m-0 list-none p-0">
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        const dotColor = (event.status && DOT_COLORS[event.status]) || 'bg-[var(--text)]';

        return (
          <li key={event.key} className="relative flex gap-3 pb-4 last:pb-0">
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

/* ---------- Contenido ---------- */

export function AppointmentDetailContent({ appointment, showClient = true }: AppointmentDetailContentProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <InfoTile label="Fecha">{formatAppointmentDate(appointment.scheduledStart)}</InfoTile>
        <InfoTile label="Horario">
          {formatAppointmentTime(appointment.scheduledStart)} - {formatAppointmentTime(appointment.scheduledEnd)}
        </InfoTile>
        <InfoTile label="Sucursal">{appointment.shopName}</InfoTile>
        <InfoTile label="Barbero">{appointment.barberName}</InfoTile>

        {showClient && (
          <InfoTile label="Cliente" className="col-span-2 lg:col-span-3">
            <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
              <span>{appointment.clientName}</span>
              <span className="font-normal text-[var(--text)]">{appointment.clientEmail ?? 'Sin correo'}</span>
              {!appointment.isRegisteredClient && (
                <span className="rounded-full bg-[#2C2C2C] px-2 py-0.5 text-[0.65rem] font-semibold uppercase text-[var(--text)]">
                  Invitado
                </span>
              )}
            </span>
          </InfoTile>
        )}

        <InfoTile label="Total" className={showClient ? 'col-span-2 lg:col-span-1' : 'col-span-2 lg:col-span-4'}>
          <span className="text-[var(--accent)]">{formatPrice(getAppointmentTotal(appointment))}</span>
          <span className="ml-2 text-xs font-normal text-[var(--text)]">{getAppointmentDuration(appointment)} min</span>
        </InfoTile>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section>
          <SectionTitle>Servicios</SectionTitle>
          <ul className="m-0 list-none p-0">
            {appointment.services.map((service) => (
              <li
                key={service.serviceId}
                className="flex items-baseline justify-between gap-4 border-b border-white/5 py-2 text-sm first:pt-0"
              >
                <span className="text-[var(--text-h)]">
                  {service.name}
                  <span className="ml-2 text-xs text-[var(--text)]">{service.durationMinutesAtBooking} min</span>
                </span>
                <span className="font-semibold text-[var(--text-h)]">{formatPrice(service.priceAtBooking)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <SectionTitle>Seguimiento</SectionTitle>
          <Timeline appointment={appointment} />
        </section>
      </div>

      {appointment.notes && (
        <section className="mt-6">
          <SectionTitle>Notas</SectionTitle>
          <div className="rounded-lg border border-white/10 bg-black/20 px-3.5 py-2.5 text-sm text-[var(--text-h)]">
            {appointment.notes}
          </div>
        </section>
      )}
    </>
  );
}