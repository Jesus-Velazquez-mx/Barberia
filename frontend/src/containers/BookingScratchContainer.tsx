import { useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Plus, X } from 'lucide-react';
import { SelectField } from '../components/SelectFieldComponent';
import { AvailabilityCalendar } from '../components/AvailabilityCalendarComponent';
import { SlotPickerModal } from '../components/SlotPickerModalComponent';
import {
  MOCK_SHOPS,
  MOCK_SERVICES,
  MOCK_SCENARIOS,
  MOCK_SCENARIO_ERROR,
  buildMockSlots,
  getMockDayAvailability,
  type MockScenario
} from '../mocks/bookingMock';
import type { AvailableSlot, DayAvailability } from '../types/availabilityType';
import { formatSlotTime } from '../utils/availabilityUtils';

interface BookingScratchFormValues {
  shopId: string;
  services: { serviceId: string }[];
  scenario: MockScenario;
}

const pad = (value: number) => String(value).padStart(2, '0');

// Fecha local de hoy en YYYY-MM-DD.
const getTodayLocal = (): string => {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().split('T')[0];
};

const SHOP_OPTIONS = [{ value: '', label: 'Selecciona una sucursal' }, ...MOCK_SHOPS];

// Ventana de reserva: desde hoy hasta 30 días después
const BOOKING_WINDOW_DAYS = 30;

/* Contenedor temporal con datos mock. Se reemplaza en la tarea
   "Crear contenedor, página y ruta del flujo de reserva". */
export function BookingScratchContainer() {
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

  const { register, watch, control } = useForm<BookingScratchFormValues>({
    defaultValues: { shopId: '', services: [{ serviceId: '' }], scenario: 'data' }
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'services' });
  const { shopId, services, scenario } = watch();

  // Servicios ya elegidos (sin filas vacías)
  const selectedServiceIds = services.map((s) => s.serviceId).filter(Boolean);
  const serviceKey = selectedServiceIds.join(',');
  const canAddService = services.length < MOCK_SERVICES.length && services.every((s) => s.serviceId);

  // Cada fila ofrece solo los servicios que no se eligieron en otra fila
  const getServiceOptions = (index: number) => {
    const takenByOthers = services.filter((_, i) => i !== index).map((s) => s.serviceId);
    return [
      { value: '', label: 'Selecciona un servicio' },
      ...MOCK_SERVICES.filter((option) => !takenByOthers.includes(option.value))
    ];
  };

  const resetSelection = () => {
    setSelectedDate(null);
    setSelectedSlot(null);
    setConfirmedSlot(null);
    setIsModalOpen(false);
  };

  // Color y cantidad de horarios por día del mes visible
  const availabilityByDate = useMemo(() => {
    const result: Record<string, DayAvailability> = {};
    const serviceIds = serviceKey ? serviceKey.split(',') : [];
    if (!shopId || serviceIds.length === 0) return result;
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${view.year}-${pad(view.month + 1)}-${pad(day)}`;
      if (dateKey < today || dateKey > maxDate) continue;
      result[dateKey] = getMockDayAvailability(shopId, serviceIds, dateKey);
    }
    return result;
  }, [shopId, serviceKey, view, today, maxDate]);

  // Lo que recibe el modal según el escenario mock elegido
  let slots: AvailableSlot[] = [];
  let isLoading = false;
  let error: string | null = null;
  if (selectedDate) {
    if (scenario === 'data') slots = buildMockSlots(shopId, selectedServiceIds, selectedDate);
    else if (scenario === 'loading') isLoading = true;
    else if (scenario === 'error') error = MOCK_SCENARIO_ERROR;
  }

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

  const shopLabel = MOCK_SHOPS.find((s) => s.value === shopId)?.label;
  const serviceLabels = selectedServiceIds
    .map((id) => MOCK_SERVICES.find((s) => s.value === id)?.label)
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
        <div className='flex flex-col gap-6 min-w-fit w-full max-w-190'>
          <div className="flex flex-col gap-5 rounded-xl border border-[#2c2c2c] bg-[#1a1a1a] p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <SelectField
                id="booking-shop"
                label="Sucursal"
                options={SHOP_OPTIONS}
                registerProps={register('shopId', { onChange: resetSelection })}
              />
              <SelectField
                id="booking-scenario"
                label="Estado de horarios (demo)"
                options={MOCK_SCENARIOS}
                registerProps={register('scenario')}
              />
            </div>

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

              {services.length < MOCK_SERVICES.length && (
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
        slots={slots}
        isLoading={isLoading}
        error={error}
        selectedSlot={selectedSlot}
        onSelectSlot={setSelectedSlot}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
