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
import { AppointmentStatusBadge } from './AppointmentStatusBadgeComponent';
import { Modal } from '../common/ModalComponent';
import { RewardBadge } from './RewardBadgeComponent';
import { WalkInBadge } from './WalkInBadgeComponent';
import { AlertCircle, Loader2, Pencil, Trash, UserCheck, X } from 'lucide-react';

interface AppointmentDetailModalProps {
  /* null = modal cerrado. */
  appointment: AppointmentRecord | null;
  onClose: () => void;
  /* Si se pasa, se muestra "Check-in". El contenedor decide cuándo está habilitado. */
  onCheckIn?: () => void;
  /* Muestra el estado de carga del check-in y bloquea acciones mientras termina. */
  isCheckingIn?: boolean;
  /* Mensaje legible si falló el check-in desde el modal. */
  checkInError?: string;
  /* Si se pasa, se muestra "Editar cita". El contenedor decide cuándo se puede editar. */
  onEdit?: () => void;
  /* Si se pasa, se muestra "Cancelar cita". El contenedor decide cuándo se puede cancelar. */
  onCancel?: () => void;
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

/* ---------- Modal ---------- */

export function AppointmentDetailModal({
  appointment,
  onClose,
  onCheckIn,
  isCheckingIn = false,
  checkInError = '',
  onEdit,
  onCancel
}: AppointmentDetailModalProps) {
  return (
    <Modal
      isOpen={appointment !== null}
      onClose={onClose}
      closeOnOutsideClick={!isCheckingIn}
      className="!max-w-4xl pb-8"
    >
      {appointment && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="m-0 font-sans font-bold tracking-normal text-[var(--text-h)]">Detalle de la cita</h2>
              <span className="mt-0.5 block text-sm text-[var(--text)]">ID: {appointment.id.slice(0, 8)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {appointment.isWalkIn && <WalkInBadge />}
              {appointment.isRewardRedemption && <RewardBadge />}
              <AppointmentStatusBadge status={appointment.status} />
              <button
                type="button"
                onClick={onClose}
                disabled={isCheckingIn}
                aria-label="Cerrar"
                className="ml-1 cursor-pointer text-[var(--text)] transition-colors hover:text-[var(--text-h)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>
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
                    Visitante
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

          {appointment.isWalkIn && (appointment.status === 'scheduled' || appointment.status === 'rescheduled') && (
            <div className="mt-6 rounded-lg border border-[#9B7EDE]/40 bg-[#9B7EDE]/10 px-3.5 py-2.5 text-sm text-[#DDD0F7]">
              Servicio sin cita previa (walk-in): no requiere check-in manual, pasará automáticamente a{' '}
              <span className="font-semibold">Iniciada</span> al llegar su hora programada.
            </div>
          )}

          {checkInError && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-2.5 rounded-lg border border-[#ff4d4d]/40 bg-[#ff4d4d]/10 px-3.5 py-2.5 text-sm font-medium text-[#ffb3b3]"
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-[#ff4d4d]" aria-hidden="true" />
              <span>{checkInError}</span>
            </div>
          )}

          {/* Sin acciones (p. ej. cita ya cancelada) no se dibuja la barra, para no dejar un hueco vacío. */}
          {(onCheckIn || onEdit || onCancel) && (
            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              {onCheckIn && (
                <button
                  type="button"
                  onClick={onCheckIn}
                  disabled={isCheckingIn}
                  className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg border-none bg-[var(--accent)] px-5 text-sm font-bold text-[#111] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCheckingIn ? (
                    <>
                      <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                      Registrando check-in...
                    </>
                  ) : (
                    <>
                      <UserCheck size={16} aria-hidden="true" />
                      Check-in
                    </>
                  )}
                </button>
              )}

              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  disabled={isCheckingIn}
                  className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-[#262626] px-5 text-sm font-semibold text-[var(--text-h)] transition-colors hover:border-[var(--accent)]/60 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Pencil size={16} aria-hidden="true" />
                  Editar cita
                </button>
              )}

              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isCheckingIn}
                  className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-[#C4608F]/40 bg-[#C4608F]/10 px-5 text-sm font-semibold text-[#E58AB3] transition-colors hover:border-[#C4608F] hover:bg-[#C4608F]/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash size={16} aria-hidden="true" />
                  Cancelar cita
                </button>
              )}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
