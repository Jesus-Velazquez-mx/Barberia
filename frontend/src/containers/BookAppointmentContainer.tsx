import { useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Plus, X } from 'lucide-react';
import { SelectField } from '../components/SelectFieldComponent';
import { AvailabilityCalendar } from '../components/AvailabilityCalendarComponent';
import { SlotPickerModal } from '../components/SlotPickerModalComponent';
import { getShops, getActiveBarbersByShop, getOfferedServices } from '../services/shopService';
import { getShopAvailability } from '../services/availabilityService';
import { ApiError } from '../types/api';
import type { AvailableSlot, DayAvailability } from '../types/availabilityType';
import type { Barber } from '../types/barber';
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

export function BookAppointmentContainer() {
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
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [availabilityByDate, setAvailabilityByDate] = useState<Record<string, DayAvailability>>({});
  const [fetchedSlots, setFetchedSlots] = useState<AvailableSlot[]>([]);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const { register, watch, control } = useForm<BookAppointmentFormValues>({
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
    let active = true;

    Promise.all([getShops(), getOfferedServices()])
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
  }, []);

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
    const primaryServiceId = selectedServiceIds[0];
    if (!shopId || !primaryServiceId) {
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
            serviceId: primaryServiceId
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
    const primaryServiceId = selectedServiceIds[0];
    if (!shopId || !selectedDate || !primaryServiceId) {
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
      serviceId: primaryServiceId
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
          <p className="m-0 rounded-xl border border-dashed border-white/15 px-6 py-12 text-center text-(--text) min-w-fit w-full max-w-160">
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