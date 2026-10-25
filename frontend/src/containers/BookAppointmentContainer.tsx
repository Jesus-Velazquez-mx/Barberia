import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFieldArray, useForm } from 'react-hook-form';
import { Plus, X } from 'lucide-react';
import { Button } from '../components/ButtonComponent';
import { SelectField } from '../components/SelectFieldComponent';
import { AvailabilityCalendar } from '../components/AvailabilityCalendarComponent';
import { SlotPickerModal } from '../components/SlotPickerModalComponent';
import { getShops, getActiveBarbersByShop, getOfferedServices } from '../services/shopService';
import { getShopAvailability } from '../services/availabilityService';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../types/api';
import type { AvailableSlot, DayAvailability } from '../types/availabilityType';
import type { PublicBarber } from '../types/barber';
import { formatSlotTime } from '../utils/availabilityUtils';

interface BookAppointmentFormValues {
  shopId: string;
  services: { serviceId: string }[];
}

const DEFAULT_FETCH_ERROR = 'No se pudieron cargar los horarios disponibles. Intenta de nuevo.';

const pad = (value: number) => String(value).padStart(2, '0');

// Fecha local de hoy en YYYY-MM-DD.
const getTodayLocal = (): string => {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().split('T')[0];
};

/* Convierte errores de la API en mensajes legibles siguiendo el patrón de EditUserModalContainer. */
const formatApiError = (error: unknown, fallbackMessage: string): string => {
  if (error instanceof ApiError) {
    if (error.status === 400 && error.errors.length > 0) {
      return error.errors
        .map((e: unknown) =>
          typeof e === 'string' ? e : ((e as { message?: string }).message ?? JSON.stringify(e))
        )
        .join(' ');
    }
    if (error.status === 404) {
      return error.message || 'La sucursal o el servicio seleccionado no existe.';
    }
    return error.message;
  }

  return fallbackMessage;
};

// Ventana de reserva: desde hoy hasta 30 días después
const BOOKING_WINDOW_DAYS = 30;

/* Página (dentro del dashboard) donde cada rol ve las citas agendadas. Hoy es un placeholder. */
const APPOINTMENTS_ROUTE_BY_ROLE: Record<string, string> = {
  client: '/client/appointments',
  receptionist: '/receptionist/appointments'
};

const BOOKING_SUCCESS_MESSAGE = 'Cita agendada correctamente.';

export function BookAppointmentContainer() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const today = getTodayLocal();
  const [todayYear, todayMonth, todayDay] = today.split('-').map(Number);
  const currentMonthIndex = todayYear * 12 + (todayMonth - 1);

  const maxDateObj = new Date(todayYear, todayMonth - 1, todayDay + BOOKING_WINDOW_DAYS);
  const maxDate = `${maxDateObj.getFullYear()}-${pad(maxDateObj.getMonth() + 1)}-${pad(maxDateObj.getDate())}`;
  const maxMonthIndex = maxDateObj.getFullYear() * 12 + maxDateObj.getMonth();

  const [view, setView] = useState({ year: todayYear, month: todayMonth - 1 });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [confirmedSlot, setConfirmedSlot] = useState<AvailableSlot | null>(null);

  /* Arreglos con datos reales del backend */
  const [shopOptions, setShopOptions] = useState<{ value: string; label: string }[]>([]);
  const [serviceOptions, setServiceOptions] = useState<{ value: string; label: string }[]>([]);
  const [barbers, setBarbers] = useState<PublicBarber[]>([]);
  const [availabilityByDate, setAvailabilityByDate] = useState<Record<string, DayAvailability>>({});
  const [fetchedSlots, setFetchedSlots] = useState<AvailableSlot[]>([]);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const { register, watch, control, reset } = useForm<BookAppointmentFormValues>({
    defaultValues: { shopId: '', services: [{ serviceId: '' }] }
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'services' });
  const { shopId, services } = watch();

  const SHOP_OPTIONS = useMemo(
    () => [{ value: '', label: 'Selecciona una sucursal' }, ...shopOptions],
    [shopOptions]
  );

  // Servicios ya elegidos (sin filas vacías)
  const selectedServiceIds = services.map((s) => s.serviceId).filter(Boolean);
  const serviceKey = selectedServiceIds.join(',');
  const canAddService = services.length < serviceOptions.length && services.every((s) => s.serviceId);

  /* 1. Cargar sucursales y servicios al montar */
  useEffect(() => {
    if (!token) return;
    let active = true;

    Promise.all([getShops(), getOfferedServices(token)])
      .then(([shopsData, servicesData]) => {
        if (!active) return;
        setShopOptions(shopsData.map((shop) => ({ value: shop.id, label: shop.name })));
        setServiceOptions(servicesData.map((service) => ({ value: service.id, label: service.name })));
      })
      .catch((error) => {
        console.error(formatApiError(error, 'Error al cargar sucursales o servicios.'));
      });

    return () => {
      active = false;
    };
  }, [token]);

  /* 2. Cargar los barberos activos cuando cambia la sucursal */
  useEffect(() => {
    if (!shopId) {
      setBarbers([]);
      return;
    }

    let active = true;
    getActiveBarbersByShop(shopId)
      .then((data) => {
        if (active) setBarbers(data);
      })
      .catch((error) => {
        console.error(formatApiError(error, 'Error al cargar barberos de la sucursal.'));
        if (active) setBarbers([]);
      });

    return () => {
      active = false;
    };
  }, [shopId]);

  /* 3. Calcular la disponibilidad real de cada día del mes visible en el calendario */
  useEffect(() => {
    if (!shopId || selectedServiceIds.length === 0) {
      setAvailabilityByDate({});
      return;
    }

    let active = true;
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const validDates: string[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${view.year}-${pad(view.month + 1)}-${pad(day)}`;
      if (dateKey >= today && dateKey <= maxDate) {
        validDates.push(dateKey);
      }
    }

    Promise.all(
      validDates.map(async (dateKey) => {
        try {
          const data = await getShopAvailability({
            shopId,
            date: dateKey,
            serviceIds: selectedServiceIds
          });
          const totalSlots = data.reduce((sum, item) => sum + item.startTimes.length, 0);
          const isSunday = new Date(`${dateKey}T00:00:00`).getDay() === 0;

          const dayAvailability: DayAvailability = {
            status: totalSlots > 0 ? 'available' : isSunday ? 'closed' : 'full',
            slotsCount: totalSlots
          };
          return [dateKey, dayAvailability] as const;
        } catch {
          return [dateKey, { status: 'available', slotsCount: 0 } as DayAvailability] as const;
        }
      })
    ).then((entries) => {
      if (!active) return;
      setAvailabilityByDate(Object.fromEntries(entries));
    });

    return () => {
      active = false;
    };
  }, [shopId, serviceKey, view.year, view.month, today, maxDate]);

  /* 4. Consultar los slots detallados cada vez que cambie sucursal, fecha o servicio */
  useEffect(() => {
    if (!shopId || !selectedDate || selectedServiceIds.length === 0) {
      setFetchedSlots([]);
      setFetchError(null);
      return;
    }

    let active = true;
    setIsFetchingSlots(true);
    setFetchError(null);

    getShopAvailability({
      shopId,
      date: selectedDate,
      serviceIds: selectedServiceIds
    })
      .then((availabilityData) => {
        if (!active) return;

        const barberMap = new Map(
          barbers.map((b) => [b.id, `${b.firstName} ${b.lastName}`.trim()])
        );

        const mappedSlots: AvailableSlot[] = availabilityData.flatMap((item) => {
          const barberName = barberMap.get(item.barberId) ?? 'Barbero';
          return item.startTimes.map((startTime) => ({
            barberId: item.barberId,
            barberName,
            startTime
          }));
        });

        setFetchedSlots(mappedSlots);
      })
      .catch((error) => {
        if (!active) return;
        setFetchError(formatApiError(error, DEFAULT_FETCH_ERROR));
        setFetchedSlots([]);
      })
      .finally(() => {
        if (active) setIsFetchingSlots(false);
      });

    return () => {
      active = false;
    };
  }, [shopId, selectedDate, serviceKey, barbers]);

  /* Cada fila ofrece solo los servicios que no se eligieron en otra fila */
  const getServiceOptions = (index: number) => {
    const takenByOthers = services.filter((_, i) => i !== index).map((s) => s.serviceId);
    return [
      { value: '', label: 'Selecciona un servicio' },
      ...serviceOptions.filter((option) => !takenByOthers.includes(option.value))
    ];
  };

  const resetSelection = () => {
    setSelectedDate(null);
    setSelectedSlot(null);
    setConfirmedSlot(null);
    setIsModalOpen(false);
  };

  /* Cancelar: deja el formulario, el calendario y el resumen como al entrar a la página. */
  const handleCancel = () => {
    reset({ shopId: '', services: [{ serviceId: '' }] });
    resetSelection();
    setView({ year: todayYear, month: todayMonth - 1 });
  };

  /* Agendar: por ahora no se llama al backend (falta el servicio de crear cita). Muestra la confirmación
     y manda al usuario a la página de citas agendadas; el aviso viaja en el state y lo pinta DashboardLayout. */
  const handleBook = () => {
    if (!canBook) return;
    navigate(APPOINTMENTS_ROUTE_BY_ROLE[user?.role ?? 'client'] ?? '/client/appointments', {
      state: { toast: BOOKING_SUCCESS_MESSAGE }
    });
  };

  const viewIndex = view.year * 12 + view.month;
  const handleMonthChange = (delta: number) => {
    const next = new Date(view.year, view.month + delta, 1);
    setView({ year: next.getFullYear(), month: next.getMonth() });
  };

  const handleSelectDay = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setIsModalOpen(true);
  };

  const handleConfirm = () => {
    if (!selectedSlot) return;
    setConfirmedSlot(selectedSlot);
    setIsModalOpen(false);
  };

  const canBook = Boolean(shopId && selectedServiceIds.length > 0 && confirmedSlot);

  const shopLabel = shopOptions.find((s) => s.value === shopId)?.label;
  const serviceLabels = selectedServiceIds
    .map((id) => serviceOptions.find((s) => s.value === id)?.label)
    .filter(Boolean)
    .join(', ');
  const dateLabel = selectedDate
    ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
    : '';

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col items-start gap-6 min-[110rem]:flex-row">
        {/* Formulario */}
        <div className="flex flex-col gap-6 min-w-fit w-full max-w-190">
          <div className="flex flex-col gap-5 rounded-xl border border-[#2c2c2c] bg-[#1a1a1a] p-6">
            <SelectField
              id="booking-shop"
              label="Sucursal"
              options={SHOP_OPTIONS}
              registerProps={register('shopId', { onChange: resetSelection })}
            />

            <div className="flex flex-col gap-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-3">
                  <div className="flex-1">
                    <SelectField
                      id={`booking-service-${index}`}
                      label={fields.length > 1 ? `Servicio ${index + 1}` : 'Servicio'}
                      options={getServiceOptions(index)}
                      registerProps={register(`services.${index}.serviceId`, { onChange: resetSelection })}
                    />
                  </div>
                  {index > 0 && (
                    <button
                      type="button"
                      aria-label={`Quitar servicio ${index + 1}`}
                      onClick={() => {
                        remove(index);
                        resetSelection();
                      }}
                      className="flex h-12.5 w-12.5 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-transparent text-(--text) transition-colors hover:border-(--accent) hover:text-(--accent)"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              ))}

              {services.length < serviceOptions.length && (
                <button
                  type="button"
                  disabled={!canAddService}
                  onClick={() => append({ serviceId: '' })}
                  className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-(--accent) bg-transparent px-4 py-2 text-sm font-semibold text-(--accent) transition-colors hover:bg-(--accent)/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <Plus size={16} />
                  Añadir otro servicio
                </button>
              )}
            </div>
          </div>
          {/* Resumen de la selección */}
          <div className="rounded-xl border border-[#2c2c2c] bg-[#1a1a1a] p-6 text-sm text-(--text)">
            <h2 className="mb-3 mt-0 font-sans text-lg font-bold tracking-normal text-(--text-h)">
              Información de la cita
            </h2>
            <p className="m-0">
              Sucursal: <span className="text-(--text-h)">{shopLabel ?? '—'}</span>
            </p>
            <p className="m-0">
              {selectedServiceIds.length > 1 ? 'Servicios' : 'Servicio'}:{' '}
              <span className="text-(--text-h)">{serviceLabels || '—'}</span>
            </p>
            <p className="m-0">
              Fecha: <span className="text-(--text-h)">{selectedDate ?? '—'}</span>
            </p>
            <p className="m-0">
              Horario:{' '}
              <span className="text-(--text-h)">
                {confirmedSlot ? `${formatSlotTime(confirmedSlot.startTime)} · ${confirmedSlot.barberName}` : '—'}
              </span>
            </p>

            <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-white/10 pt-5">
              <Button
                type="button"
                onClick={handleCancel}
                className="h-12! border! border-solid! border-(--text)! bg-transparent! px-8! normal-case! text-(--text)!"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleBook}
                disabled={!canBook}
                className="h-12! px-8! normal-case! disabled:cursor-not-allowed! disabled:opacity-50!"
              >
                Agendar Cita
              </Button>
            </div>
          </div>
        </div>

        {/* Calendario */}
        {shopId && selectedServiceIds.length > 0 ? (
          <AvailabilityCalendar
            year={view.year}
            month={view.month}
            today={today}
            maxDate={maxDate}
            availabilityByDate={availabilityByDate}
            selectedDate={selectedDate}
            canGoPrev={viewIndex > currentMonthIndex}
            canGoNext={viewIndex < maxMonthIndex}
            onPrevMonth={() => handleMonthChange(-1)}
            onNextMonth={() => handleMonthChange(1)}
            onSelectDay={handleSelectDay}
          />
        ) : (
          <p className="m-0 rounded-xl border border-dashed border-white/15 px-6 py-12 text-center text-(--text) min-w-fit w-full max-w-190">
            Selecciona una sucursal y al menos un servicio para ver la disponibilidad.
          </p>
        )}
      </div>

      <SlotPickerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        dateLabel={dateLabel}
        slots={fetchedSlots}
        isLoading={isFetchingSlots}
        error={fetchError}
        selectedSlot={selectedSlot}
        onSelectSlot={setSelectedSlot}
        onConfirm={handleConfirm}
      />
    </div>
  );
}