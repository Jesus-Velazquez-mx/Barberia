import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Pencil, RotateCw, XCircle } from 'lucide-react';
import type { AppointmentRecord } from '../types/appointmentType';
import { useAuth } from '../context/AuthContext';
import { AppointmentDetailContent } from '../components/appointments/AppointmentDetailContentComponent';
import { AppointmentStatusBadge } from '../components/appointments/AppointmentStatusBadgeComponent';
import { RewardBadge } from '../components/appointments/RewardBadgeComponent';
// NUEVO
import { EditAppointmentModal } from '../components/appointments/EditAppointmentModalComponent';
import { CancelAppointmentModal } from '../components/appointments/CancelAppointmentModalComponent';
import { getAppointmentById } from '../services/appointmentService';
// NUEVO: por ahora los modales de editar y cancelar usan datos simulados
import {
  MOCK_BARBERS,
  MOCK_CATALOG,
  mockCancelAppointment,
  mockLoadSlots,
  mockUpdateAppointment,
  toMockEditable
} from '../mocks/editAppointmentMockData';

export const CLIENT_APPOINTMENTS_PATH = '/client/appointments';

export function ClientAppointmentDetailContainer() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const { user, token } = useAuth();
  const [appointment, setAppointment] = useState<AppointmentRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // NUEVO: estado del modal de edición
  const [isEditOpen, setIsEditOpen] = useState(false);
  // NUEVO: estado del modal de cancelación
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  // NUEVO: con silent no se muestra el esqueleto, así el modal no se desmonta al refrescar tras guardar.
  const load = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!user || !token || !appointmentId) return;

    if (!silent) setIsLoading(true);
    setError('');
    try {
      const found = await getAppointmentById(token, appointmentId, {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email
      });

      if (!found) {
        setAppointment(null);
        setError('No encontramos esta cita.');
      } else {
        setAppointment(found);
      }
    } catch {
      setError('No se pudo cargar la cita.');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [user?.id, token, appointmentId]);

  // Solo se puede editar o cancelar una cita agendada o reagendada que aún no ha terminado.
  const canModify =
    appointment !== null &&
    (appointment.status === 'scheduled' || appointment.status === 'rescheduled') &&
    new Date(appointment.scheduledEnd).getTime() > Date.now();

  return (
    <div className="rounded-xl border border-white/10 bg-[#1A1A1A] p-6">
      {isLoading && (
        <div className="flex flex-col gap-4" aria-busy="true" aria-label="Cargando cita">
          <div className="h-7 w-56 animate-pulse rounded bg-white/10" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-white/10" />
            ))}
          </div>
          <div className="h-40 animate-pulse rounded-lg bg-white/10" />
        </div>
      )}

      {!isLoading && error && (
        <div className="py-10 text-center">
          <p className="text-sm font-semibold text-[#ff4d4d]" role="alert">
            {error}
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-[#262626] px-4 py-2 text-sm font-semibold text-[var(--text-h)] transition-colors hover:border-[var(--accent)]/60"
            >
              <RotateCw size={14} aria-hidden="true" />
              Reintentar
            </button>
          </div>
        </div>
      )}

      {!isLoading && !error && appointment && (
        <>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-[var(--text)]">ID: {appointment.id.slice(0, 8)}</span>
            <div className="flex flex-wrap items-center gap-2">
              {appointment.isRewardRedemption && <RewardBadge />}
              <AppointmentStatusBadge status={appointment.status} />
            </div>
          </div>

          <AppointmentDetailContent appointment={appointment} showClient={false} />

          {canModify && (
            <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-white/10 pt-5">
              <button
                type="button"
                onClick={() => setIsEditOpen(true)}
                className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-[#262626] px-5 text-sm font-semibold text-[var(--text-h)] transition-colors hover:border-[var(--accent)]/60"
              >
                <Pencil size={16} aria-hidden="true" />
                Editar cita
              </button>

              <button
                type="button"
                onClick={() => setIsCancelOpen(true)}
                className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-[#C4608F]/40 bg-[#C4608F]/10 px-5 text-sm font-semibold text-[#E58AB3] transition-colors hover:border-[#C4608F] hover:bg-[#C4608F]/20"
              >
                <XCircle size={16} aria-hidden="true" />
                Cancelar cita
              </button>
            </div>
          )}

          {/* NUEVO: se monta solo al abrir para que el formulario arranque limpio cada vez */}
          {isEditOpen && (
            <EditAppointmentModal
              appointment={toMockEditable(appointment)}
              role="client"
              catalog={MOCK_CATALOG}
              barbers={MOCK_BARBERS}
              loadSlots={mockLoadSlots}
              onSubmit={mockUpdateAppointment}
              onClose={() => setIsEditOpen(false)}
            />
          )}

          {/* NUEVO: cancelación con motivo obligatorio. Tras cancelar se recarga la cita, así que el estado
              pasa a "Cancelada" y los botones de editar y cancelar desaparecen (canModify). */}
          {isCancelOpen && (
            <CancelAppointmentModal
              appointment={appointment}
              role="client"
              onSubmit={async (id, payload) => {
                await mockCancelAppointment(id, payload);
                await load({ silent: true });
              }}
              onClose={() => setIsCancelOpen(false)}
            />
          )}
        </>
      )}
    </div>
  );
}