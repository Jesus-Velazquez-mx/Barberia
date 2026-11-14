import { useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { X } from 'lucide-react';
import type { AppointmentRecord } from '../../types/appointmentType';
import { formatAppointmentDate, formatAppointmentTime, formatPrice } from '../../utils/appointmentUtils';
import { Modal } from '../common/ModalComponent';
import type { UserRole } from './EditAppointmentModalComponent';

/* ------------------------------------------------------------------ */
/* Constantes (deben coincidir con el backend)                        */
/* ------------------------------------------------------------------ */

const CLIENT_CUTOFF_HOURS = 8; // solo aplica al rol client
const MS_PER_HOUR = 3_600_000;
const REASON_MAX_LENGTH = 255; // appointments.cancellation_reason es varchar(255)

/* ------------------------------------------------------------------ */
/* Tipos                                                              */
/* ------------------------------------------------------------------ */

export interface CancelPayload {
  /* Motivo obligatorio (máx. 255 caracteres), sin espacios al inicio ni al final. */
  reason: string;
}

interface CancelAppointmentModalProps {
  appointment: AppointmentRecord;
  role: UserRole;
  /** POST/PATCH de cancelación. Debe lanzar un Error con mensaje legible si falla. */
  onSubmit: (appointmentId: string, payload: CancelPayload) => Promise<void>;
  onClose: () => void;
}

/* ------------------------------------------------------------------ */
/* Piezas                                                             */
/* ------------------------------------------------------------------ */

function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/5 py-2 text-sm last:border-b-0">
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-(--text)">{label}</span>
      <span className="text-right font-semibold text-(--text-h)">{children}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Componente                                                         */
/* ------------------------------------------------------------------ */

/**
 * Renderízalo de forma condicional ({open && <CancelAppointmentModal ... />}) para que el formulario
 * arranque limpio cada vez que se abre.
 */
export function CancelAppointmentModal({ appointment, role, onSubmit, onClose }: CancelAppointmentModalProps) {
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Mismas reglas que loadModifiableAppointment: editar y cancelar comparten bloqueos. */
  const lockReason = useMemo(() => {
    const startMs = Date.parse(appointment.scheduledStart);
    const now = Date.now();
    if (appointment.status !== 'scheduled' && appointment.status !== 'rescheduled') {
      return 'Solo se pueden cancelar citas agendadas o reagendadas.';
    }
    if (startMs <= now) return 'Esta cita ya comenzó, no se puede cancelar.';
    if (role === 'client' && startMs - now < CLIENT_CUTOFF_HOURS * MS_PER_HOUR) {
      return `No puedes cancelar la cita con menos de ${CLIENT_CUTOFF_HOURS} horas de anticipación.`;
    }
    return null;
  }, [appointment, role]);

  const isClient = role === 'client';
  const total = appointment.services.reduce((sum, s) => sum + s.priceAtBooking, 0);

  const handleClose = () => {
    if (!saving) onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (lockReason || saving) return;

    const trimmed = reason.trim();
    if (!trimmed) {
      setReasonError('Escribe el motivo de la cancelación.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSubmit(appointment.id, { reason: trimmed });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cancelar la cita.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={handleClose} closeOnOutsideClick={!saving} className="!max-w-lg">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h2 className="m-0 text-xl font-semibold text-(--text-h)">Cancelar cita</h2>
          <span className="mt-1 block text-[0.9rem] text-(--text)">
           Esta acción no se puede deshacer. ¿Estas seguro de cancelar esta cita?.
          </span>
        </div>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Cerrar"
          className="cursor-pointer text-(--text) transition-colors hover:text-(--text-h)"
        >
          <X size={20} />
        </button>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        {/* Resumen de lo que se va a cancelar */}
        <div className="rounded-lg border border-white/10 bg-black/20 px-3.5 py-1.5">
         <SummaryRow label="ID">{appointment.id.slice(0, 8)}</SummaryRow>
          {!isClient && <SummaryRow label="Cliente">{appointment.clientName}</SummaryRow>}
          <SummaryRow label="Fecha">{formatAppointmentDate(appointment.scheduledStart)}</SummaryRow>
          <SummaryRow label="Horario">
            {formatAppointmentTime(appointment.scheduledStart)} - {formatAppointmentTime(appointment.scheduledEnd)}
          </SummaryRow>
          <SummaryRow label="Barbero">{appointment.barberName}</SummaryRow>
          <SummaryRow label="Servicios">{appointment.services.map((s) => s.name).join(', ')}</SummaryRow>
          <SummaryRow label="Total">
            <span className="text-(--accent)">{formatPrice(total)}</span>
          </SummaryRow>
        </div>

        {/* Motivo (obligatorio) */}
        {!lockReason && (
          <label className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-(--accent)">
              Motivo de la cancelación <span aria-hidden="true">*</span>
            </span>
            <textarea
              rows={3}
              value={reason}
              maxLength={REASON_MAX_LENGTH}
              disabled={saving}
              required
              aria-invalid={reasonError !== ''}
              aria-describedby={reasonError ? 'cancel-reason-error' : undefined}
              placeholder={isClient ? 'Cuéntanos por qué cancelas…' : 'Motivo de la cancelación…'}
              onChange={(e) => {
                setReason(e.target.value);
                if (reasonError) setReasonError('');
              }}
              className={`w-full resize-none rounded-lg border bg-black/20 px-3.5 py-2.5 text-sm text-(--text-h) outline-none placeholder:text-(--text) disabled:opacity-60 ${
                reasonError ? 'border-[#ff4d4d] focus:border-[#ff4d4d]' : 'border-white/10 focus:border-(--accent)'
              }`}
            />
            <div className="flex items-start justify-between gap-3 text-xs">
              <span id="cancel-reason-error" className="font-semibold text-[#ff4d4d]" role="alert">
                {reasonError}
              </span>
              <span className="shrink-0 text-(--text)">
                {reason.length}/{REASON_MAX_LENGTH}
              </span>
            </div>
          </label>
        )}

        {/* La recompensa del programa de lealtad no se pierde al cancelar (solo con no-show). */}
        {!lockReason && appointment.isRewardRedemption && (
          <div className="rounded-lg border border-(--accent)/40 bg-(--accent)/10 px-3 py-2 text-sm text-(--text-h)">
            {isClient
              ? 'Conservas tu recompensa y podrás usarla en otra cita.'
              : 'El cliente conserva su recompensa y podrá usarla en otra cita.'}
          </div>
        )}

        {(lockReason || error) && (
          <p className="text-center text-[0.85rem] font-semibold text-[#ff4d4d]" role="alert">
            {lockReason ?? error}
          </p>
        )}

        {/* Sticky dentro del scroll del Modal; -mx-8 compensa su px-8 para que la barra llegue a los bordes */}
        <div className="sticky bottom-0 -mx-8 mt-2 flex justify-end gap-3 border-t border-white/10 bg-[#1E1E1E] px-8 pb-6 pt-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="h-12 cursor-pointer rounded-lg border border-solid border-(--text) bg-transparent px-8 font-semibold text-(--text) transition-colors hover:text-(--text-h) disabled:cursor-not-allowed disabled:opacity-50"
          >
            {lockReason ? 'Cerrar' : 'Volver'}
          </button>
          {!lockReason && (
            <button
              type="submit"
              disabled={saving}
              className="h-12 cursor-pointer rounded-lg border border-[#C4608F]/60 bg-[#C4608F]/15 px-8 font-semibold text-[#E58AB3] transition-colors hover:border-[#C4608F] hover:bg-[#C4608F]/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Cancelando...' : 'Cancelar cita'}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}

export default CancelAppointmentModal;
