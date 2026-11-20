import { useState } from 'react';
import { UserX, X } from 'lucide-react';
import type { AppointmentRecord } from '../../types/appointmentType';
import { formatAppointmentDate, formatAppointmentTime } from '../../utils/appointmentUtils';
import { Modal } from '../common/ModalComponent';

interface MarkNoShowModalProps {
  appointment: AppointmentRecord;
  onConfirm: (appointmentId: string) => Promise<void>;
  onBack: () => void;
  onClose: () => void;
}

export function MarkNoShowModal({ appointment, onConfirm, onBack, onClose }: MarkNoShowModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const isAlreadyTerminal =
    appointment.status !== 'scheduled' && appointment.status !== 'rescheduled';

  const handleConfirm = async () => {
    if (isSaving) return;

    setIsSaving(true);
    setError('');
    try {
      await onConfirm(appointment.id);
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo marcar la cita como inasistencia.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) onClose();
  };

  return (
    <Modal isOpen onClose={handleClose} closeOnOutsideClick={!isSaving} className="!max-w-lg">
      <div className="mb-5 flex items-start justify-between gap-4 pb-5">
        <div>
          <h2 className="m-0 text-xl font-semibold text-(--text-h)">Confirmar inasistencia</h2>
          <p className="mt-2 text-sm text-(--text)">
            ¿Confirmas que el cliente no se presentó? La cita quedará cerrada y no se podrá registrar su check-in.
            Esta acción no se puede deshacer.
          </p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          disabled={isSaving}
          aria-label="Cerrar"
          className="cursor-pointer text-(--text) transition-colors hover:text-(--text-h) disabled:cursor-not-allowed"
        >
          <X size={20} />
        </button>
      </div>

      <div className="rounded-lg border border-white/10 bg-black/20 px-3.5 py-2.5 text-sm">
        <div className="flex justify-between gap-4 border-b border-white/5 py-2">
          <span className="text-xs font-semibold uppercase text-(--text)">Cliente</span>
          <span className="text-right font-semibold text-(--text-h)">{appointment.clientName}</span>
        </div>
        <div className="flex justify-between gap-4 border-b border-white/5 py-2">
          <span className="text-xs font-semibold uppercase text-(--text)">Fecha</span>
          <span className="text-right font-semibold text-(--text-h)">
            {formatAppointmentDate(appointment.scheduledStart)}
          </span>
        </div>
        <div className="flex justify-between gap-4 py-2">
          <span className="text-xs font-semibold uppercase text-(--text)">Horario</span>
          <span className="text-right font-semibold text-(--text-h)">
            {formatAppointmentTime(appointment.scheduledStart)} - {formatAppointmentTime(appointment.scheduledEnd)}
          </span>
        </div>
      </div>

      {appointment.isRewardRedemption && appointment.isRegisteredClient && (
        <p className="mt-4 rounded-lg border border-(--accent)/40 bg-(--accent)/10 px-3 py-2 text-sm text-(--text-h)">
          Al confirmar, el cliente perderá la recompensa y su contador de lealtad se reiniciará.
        </p>
      )}

      {error && (
        <p className="mt-4 text-sm font-semibold text-[#ff4d4d]" role="alert">
          {error}
        </p>
      )}

      <div className="mt-6 flex justify-end gap-3 pb-5">
        <button
          type="button"
          onClick={onBack}
          disabled={isSaving}
          className="h-11 cursor-pointer rounded-lg border border-white/10 bg-[#262626] px-5 text-sm font-semibold text-[var(--text-h)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Volver
        </button>
        <button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={isSaving || isAlreadyTerminal || appointment.isWalkIn}
          className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-[#B86B5E]/40 bg-[#B86B5E]/10 px-5 text-sm font-semibold text-[#E5B1A8] transition-colors hover:border-[#B86B5E] hover:bg-[#B86B5E]/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <UserX size={16} aria-hidden="true" />
          {isSaving ? 'Marcando...' : isAlreadyTerminal ? 'Cita ya cerrada' : 'Confirmar inasistencia'}
        </button>
      </div>
    </Modal>
  );
}
