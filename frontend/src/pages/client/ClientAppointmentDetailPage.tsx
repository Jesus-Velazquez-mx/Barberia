import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, RotateCw } from 'lucide-react';
import type { AppointmentRecord } from '../../types/appointmentType';
import { useAuth } from '../../context/AuthContext';
import { buildMockAppointments } from '../../mocks/clientAppointmentMocks';
import { AppointmentStatusBadge } from '../../components/AppointmentStatusBadgeComponent';
import { AppointmentDetailContent } from '../../components/AppointmentDetailContentComponent';

/* Ajusta a la ruta real de tu lista de citas. */
export const CLIENT_APPOINTMENTS_PATH = '/client/appointments';
const MOCK_DELAY_MS = 400;

export function ClientAppointmentDetailPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const { user } = useAuth();

  const [appointment, setAppointment] = useState<AppointmentRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    const client = {
      id: user?.id ?? 'mock-client',
      name: user ? `${user.firstName} ${user.lastName}` : 'Cliente de prueba',
      email: user?.email ?? 'cliente@email.com'
    };

    setIsLoading(true);
    setError('');
    try {
      await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
      // Solo se muestra si la cita es del cliente logeado.
      const found = buildMockAppointments(client).find((a) => a.id === appointmentId && a.clientId === client.id);
      if (!found) {
        setAppointment(null);
        setError('No encontramos esta cita.');
      } else {
        setAppointment(found);
      }
    } catch {
      setError('No se pudo cargar la cita.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [user?.id, appointmentId]);

  return (
    <section className="flex flex-col gap-6">
      <Link
        to={CLIENT_APPOINTMENTS_PATH}
        className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-[var(--text)] no-underline transition-colors hover:text-[var(--accent)]"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Volver a mis citas
      </Link>

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
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="m-0 text-2xl font-bold text-[var(--text-h)]">Detalle de la cita</h1>
                <span className="mt-0.5 block text-sm text-[var(--text)]">ID: {appointment.id.slice(0, 8)}</span>
              </div>
              <AppointmentStatusBadge status={appointment.status} />
            </div>

            <AppointmentDetailContent appointment={appointment} showClient={false} />
          </>
        )}
      </div>
    </section>
  );
}
