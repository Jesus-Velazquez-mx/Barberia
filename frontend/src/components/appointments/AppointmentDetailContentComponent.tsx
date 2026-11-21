import type { ReactNode } from 'react';
import type { AppointmentRecord } from '../../types/appointmentType';
import {
  formatAppointmentDate,
  formatAppointmentTime,
  formatPrice,
  getAppointmentDuration,
  getAppointmentTotal
} from '../../utils/appointmentUtils';
import { AppointmentTimeline } from './AppointmentTimelineComponent';

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

/* ---------- Contenido ---------- */

export function AppointmentDetailContent({ appointment, showClient = true }: AppointmentDetailContentProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <InfoTile label="Fecha">{formatAppointmentDate(appointment.scheduledStart)}</InfoTile>
        <InfoTile label="Horario">
          {formatAppointmentTime(appointment.scheduledStart)} - {formatAppointmentTime(appointment.scheduledEnd)}
          <span className="ml-2 text-xs font-normal text-[var(--text)]">{getAppointmentDuration(appointment)} min</span>
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
                  Visitante
                </span>
              )}
            </span>
          </InfoTile>
        )}

        <InfoTile label="Total" className={showClient ? 'col-span-2 lg:col-span-1' : 'col-span-2 lg:col-span-4'}>
          <span className="text-[var(--accent)]">{formatPrice(getAppointmentTotal(appointment))}</span>
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
          <AppointmentTimeline appointment={appointment} />
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
