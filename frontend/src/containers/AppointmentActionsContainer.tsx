import { useCallback, useEffect, useState } from 'react';
import type { AppointmentRecord } from '../types/appointmentType';
import { useAuth } from '../context/AuthContext';
import {
  EditAppointmentModal,
  type BarberOption,
  type LoadSlotsParams,
  type ModalService,
  type UpdatePayload,
  type UserRole
} from '../components/appointments/EditAppointmentModalComponent';
import { CancelAppointmentModal, type CancelPayload } from '../components/appointments/CancelAppointmentModalComponent';
import { Modal } from '../components/common/ModalComponent';
import { cancelAppointment, updateAppointment, type AppointmentClientInfo } from '../services/appointmentService';
import { getShopAvailability } from '../services/availabilityService';
import { getActiveBarbersByShop, getOfferedServices } from '../services/shopService';
import { getApiErrorMessage } from '../utils/apiErrorUtils';

interface ActionProps {
  appointment: AppointmentRecord;
  role: UserRole;
  /* Solo en la vista del cliente: el backend no devuelve sus datos, así que se completan con la sesión. */
  client?: AppointmentClientInfo;
  /* Se llama después de guardar con éxito, para refrescar la vista. */
  onDone: () => Promise<void> | void;
  onClose: () => void;
}

interface EditOptions {
  catalog: ModalService[];
  barbers: BarberOption[];
}

/*
 * Carga los barberos de la sucursal y el catálogo de servicios activos, y conecta EditAppointmentModal con
 * PUT /appointments/:id y GET /shops/:id/availability. Móntalo de forma condicional para que arranque limpio.
 */
export function EditAppointmentContainer({ appointment, role, client, onDone, onClose }: ActionProps) {
  const { token } = useAuth();
  const [options, setOptions] = useState<EditOptions | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoadError('');

    Promise.all([getOfferedServices(token), getActiveBarbersByShop(appointment.shopId)])
      .then(([services, shopBarbers]) => {
        if (cancelled) return;
        const barbers: BarberOption[] = shopBarbers.map((b) => ({
          id: b.id,
          name: `${b.firstName} ${b.lastName}`.trim()
        }));
        // El barbero actual puede haber dejado de aceptar reservas; se conserva como opción para no perderlo.
        if (!barbers.some((b) => b.id === appointment.barberId)) {
          barbers.unshift({ id: appointment.barberId, name: appointment.barberName });
        }
        setOptions({
          barbers,
          catalog: services
            .filter((s) => s.isActive)
            .map((s) => ({
              serviceId: s.id,
              name: s.name,
              durationMinutes: Number(s.durationMinutes),
              price: Number(s.price)
            }))
        });
      })
      .catch((error) => {
        if (!cancelled) setLoadError(getApiErrorMessage(error, 'No se pudieron cargar los datos de la cita.'));
      });

    return () => {
      cancelled = true;
    };
  }, [token, appointment.shopId, appointment.barberId, appointment.barberName]);

  const loadSlots = useCallback(
    ({ shopId, date, serviceIds, excludeAppointmentId }: LoadSlotsParams) =>
      getShopAvailability({ shopId, date, serviceIds, excludeAppointmentId, token: token ?? undefined }),
    [token]
  );

  const handleSubmit = async (appointmentId: string, payload: UpdatePayload) => {
    if (!token) throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.');
    try {
      await updateAppointment(token, appointmentId, payload, client);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'No se pudo guardar la cita.'));
    }
    await onDone();
  };

  if (!options) {
    return (
      <Modal isOpen onClose={onClose} className="!max-w-lg">
        <h2 className="m-0 mb-4 text-xl font-semibold text-(--text-h)">Editar cita</h2>
        {loadError ? (
          <p className="text-sm font-semibold text-[#ff4d4d]" role="alert">
            {loadError}
          </p>
        ) : (
          <div className="flex flex-col gap-3" aria-busy="true" aria-label="Cargando">
            <div className="h-14 animate-pulse rounded-lg bg-white/10" />
            <div className="h-14 animate-pulse rounded-lg bg-white/10" />
            <div className="h-24 animate-pulse rounded-lg bg-white/10" />
          </div>
        )}
      </Modal>
    );
  }

  return (
    <EditAppointmentModal
      appointment={appointment}
      role={role}
      catalog={options.catalog}
      barbers={options.barbers}
      loadSlots={loadSlots}
      onSubmit={handleSubmit}
      onClose={onClose}
    />
  );
}

/* Conecta CancelAppointmentModal con PUT /appointments/:id/cancel. */
export function CancelAppointmentContainer({ appointment, role, client, onDone, onClose }: ActionProps) {
  const { token } = useAuth();

  const handleSubmit = async (appointmentId: string, payload: CancelPayload) => {
    if (!token) throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.');
    try {
      await cancelAppointment(token, appointmentId, payload, client);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'No se pudo cancelar la cita.'));
    }
    await onDone();
  };

  return <CancelAppointmentModal appointment={appointment} role={role} onSubmit={handleSubmit} onClose={onClose} />;
}
