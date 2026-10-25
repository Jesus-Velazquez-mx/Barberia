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
import { AppointmentStatusBadge } from './AppointmentStatusBadgeComponent';
import { Button } from './ButtonComponent';
import { Modal } from './ModalComponent';

interface AppointmentDetailModalProps {
  /* null = modal cerrado. */
  appointment: AppointmentRecord | null;
  onClose: () => void;
}

/* ---------- Piezas ---------- */

/* Dato corto (etiqueta arriba, valor abajo) dentro de un recuadro. */
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

/* ---------- Línea de tiempo (seguimiento) ---------- */

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
      title: 'Cita agendada',
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

  if (appointment.status === 'checkedIn') {
    events.push({
      key: 'checkedIn',
      title: 'Cita iniciada',
      at: appointment.scheduledStart,
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
      at: appointment.scheduledEnd,
      status: 'completed'
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

/* ---------- Modal ---------- */

export function AppointmentDetailModal({ appointment, onClose }: AppointmentDetailModalProps) {
  return (
    <Modal isOpen={appointment !== null} onClose={onClose} className="!max-w-4xl pb-8">
      {appointment && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="m-0 font-sans font-bold tracking-normal text-[var(--text-h)]">Detalle de la cita</h2>
              <span className="mt-0.5 block text-sm text-[var(--text)]">ID: {appointment.id.slice(0, 8)}</span>
            </div>
            <AppointmentStatusBadge status={appointment.status} />
          </div>

          {/* Datos clave, de izquierda a derecha y de arriba a abajo. */}
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <InfoTile label="Fecha">{formatAppointmentDate(appointment.scheduledStart)}</InfoTile>
            <InfoTile label="Horario">
              {formatAppointmentTime(appointment.scheduledStart)} - {formatAppointmentTime(appointment.scheduledEnd)}
            </InfoTile>
            <InfoTile label="Sucursal">{appointment.shopName}</InfoTile>
            <InfoTile label="Barbero">{appointment.barberName}</InfoTile>

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
            <InfoTile label="Total" className="col-span-2 lg:col-span-1">
              <span className="text-[var(--accent)]">{formatPrice(getAppointmentTotal(appointment))}</span>
              <span className="ml-2 text-xs font-normal text-[var(--text)]">
                {getAppointmentDuration(appointment)} min
              </span>
            </InfoTile>
          </div>

          {/* Servicios y seguimiento lado a lado. */}
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

          <div className="mt-6 flex justify-end">
            <Button
              type="button"
              onClick={onClose}
              className="!h-11 !border !border-solid !border-white/10 !bg-[#2A2A2A] px-8 !normal-case !text-[var(--text-h)]"
            >
              Cerrar
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
