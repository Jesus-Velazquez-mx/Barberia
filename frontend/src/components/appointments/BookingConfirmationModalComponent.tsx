import type { ReactNode } from 'react';
import { Star, X } from 'lucide-react';
import type { CreatedAppointment } from '../../services/appointmentService';
import { formatAppointmentDate, formatAppointmentTime, formatPrice } from '../../utils/appointmentUtils';
import { formatDuration } from '../../utils/offeredServiceUtils';
import { Button } from '../common/ButtonComponent';
import { Modal } from '../common/ModalComponent';
import { RewardBadge } from './RewardBadgeComponent';
import { WalkInBadge } from './WalkInBadgeComponent';

export interface BookingConfirmationData {
  appointment: CreatedAppointment;
  isWalkIn: boolean;
  isStaff: boolean;
  previewExpectedReward: boolean;
  shopName: string;
  barberName: string;
  clientName?: string;
  serviceNames: ReadonlyMap<string, string>;
}

interface BookingConfirmationModalProps {
  confirmation: BookingConfirmationData | null;
  onViewAppointments: () => void;
  onBookAnother: () => void;
}

function ConfirmationTile({
  label,
  children,
  className = ''
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-white/10 bg-black/20 px-3.5 py-2.5 ${className}`}>
      <span className="block text-[0.7rem] font-semibold uppercase tracking-wide text-(--text)">{label}</span>
      <div className="mt-0.5 text-sm font-semibold text-(--text-h)">{children}</div>
    </div>
  );
}

/**
 * Confirmación posterior al agendado usando exclusivamente los datos devueltos por el servidor
 * (isRewardRedemption, rewardDiscount y amountDue).
 */
export function BookingConfirmationModal({
  confirmation,
  onViewAppointments,
  onBookAnother
}: BookingConfirmationModalProps) {
  const appointment = confirmation?.appointment ?? null;
  const discount = appointment?.isRewardRedemption ? appointment.rewardDiscount : null;
  const freeServiceName =
    discount && confirmation ? (confirmation.serviceNames.get(discount.serviceId) ?? 'Servicio') : null;
  const subtotal = appointment ? appointment.services.reduce((sum, s) => sum + s.priceAtBooking, 0) : 0;

  return (
    <Modal isOpen={confirmation !== null} onClose={onBookAnother} className="max-w-lg! pb-8">
      {confirmation && appointment && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="m-0 font-sans font-bold tracking-normal text-(--text-h)">
                {confirmation.isWalkIn ? 'Servicio sin cita registrado' : 'Cita agendada'}
              </h2>
              <span className="mt-0.5 block text-sm text-(--text)">ID: {appointment.id.slice(0, 8)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {confirmation.isWalkIn && <WalkInBadge />}
              {appointment.isRewardRedemption && <RewardBadge />}
              <button
                type="button"
                onClick={onBookAnother}
                aria-label="Cerrar"
                className="ml-1 cursor-pointer text-(--text) transition-colors hover:text-(--text-h)"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {discount && freeServiceName ? (
            <div
              role="status"
              className="mt-4 flex items-start gap-2.5 rounded-lg border border-(--accent)/40 bg-(--accent)/10 px-3.5 py-2.5 text-sm text-(--text-h)"
            >
              <Star size={16} fill="currentColor" className="mt-0.5 shrink-0 text-(--accent)" aria-hidden="true" />
              <span>
                Esta cita incluye un servicio gratis: <strong>{freeServiceName}</strong> (&#8722;
                {formatPrice(discount.amount)})
              </span>
            </div>
          ) : (
            !appointment.isRewardRedemption &&
            confirmation.previewExpectedReward && (
              <div
                role="status"
                className="mt-4 rounded-lg border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-(--text-h)"
              >
                {confirmation.isStaff
                  ? 'El estado de lealtad del cliente cambió antes de confirmar, por lo que esta cita se registró sin servicio gratis.'
                  : 'Tu estado de lealtad cambió antes de confirmar, por lo que esta cita se registró sin servicio gratis.'}
              </div>
            )
          )}

          <div className="mt-4 grid grid-cols-2 gap-3">
            {confirmation.isStaff && confirmation.clientName && (
              <ConfirmationTile label="Cliente" className="col-span-2">
                {confirmation.clientName}
              </ConfirmationTile>
            )}
            <ConfirmationTile label="Sucursal">{confirmation.shopName}</ConfirmationTile>
            <ConfirmationTile label="Fecha">{formatAppointmentDate(appointment.scheduledStart)}</ConfirmationTile>
            <ConfirmationTile label="Horario" className="col-span-2">
              {formatAppointmentTime(appointment.scheduledStart)} - {formatAppointmentTime(appointment.scheduledEnd)} ·{' '}
              {confirmation.barberName}
            </ConfirmationTile>
          </div>

          <section className="mt-5">
            <h3 className="m-0 mb-3 font-sans text-xs font-bold uppercase tracking-wide text-(--accent)">
              {appointment.services.length > 1 ? 'Servicios' : 'Servicio'}
            </h3>
            <ul className="m-0 list-none p-0">
              {appointment.services.map((service) => {
                const isFree = discount?.serviceId === service.serviceId;
                const serviceName = confirmation.serviceNames.get(service.serviceId) ?? 'Servicio';
                return (
                  <li
                    key={service.serviceId}
                    className="flex items-baseline justify-between gap-4 border-b border-white/5 py-2 text-sm first:pt-0"
                  >
                    <span className="text-(--text-h)">
                      {serviceName}
                      <span className="ml-2 text-xs text-(--text)">
                        {formatDuration(service.durationMinutesAtBooking)}
                      </span>
                    </span>
                    {isFree ? (
                      <span className="flex items-baseline gap-2">
                        <span className="text-xs text-(--text) line-through">
                          {formatPrice(service.priceAtBooking)}
                        </span>
                        <span className="font-semibold text-(--accent)">Gratis</span>
                      </span>
                    ) : (
                      <span className="font-semibold text-(--text-h)">{formatPrice(service.priceAtBooking)}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <div className="mt-4 flex items-baseline justify-between">
            <h3 className="m-0 font-sans text-xs font-bold uppercase tracking-wide text-(--accent)">
              {discount ? 'Total a pagar' : 'Total'}
            </h3>
            <div className="flex flex-col items-end">
              {discount && <span className="text-xs text-(--text) line-through">{formatPrice(subtotal)}</span>}
              <span className="text-2xl font-semibold text-(--accent)">{formatPrice(appointment.amountDue)}</span>
            </div>
          </div>

          {confirmation.isWalkIn && (
            <div className="mt-3 text-right text-xs text-(--text)">
              La cita pasará sola a &quot;en curso&quot; a las {formatAppointmentTime(appointment.scheduledStart)}.
            </div>
          )}

          <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-white/10 pt-5">
            <button
              type="button"
              onClick={onBookAnother}
              className="h-11 cursor-pointer rounded-lg border border-solid border-(--text) bg-transparent px-6 text-sm! font-semibold text-(--text) transition-colors hover:text-(--text-h)"
            >
              {confirmation.isWalkIn ? 'Registrar otro' : 'Agendar otra'}
            </button>
            <Button type="button" onClick={onViewAppointments} className="h-11! px-6! text-sm! normal-case!">
              {confirmation.isStaff ? 'Ver citas' : 'Ver mis citas'}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
