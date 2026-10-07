import { useForm } from 'react-hook-form';
import { SelectField } from '../components/SelectFieldComponent';
import { DateField } from '../components/DateFieldComponent';
import { MOCK_SHOPS, MOCK_SERVICES } from '../mocks/bookingMock';
import { displayToIsoDate, getTodayIso, isValidDisplayDate } from '../utils/dateFormat';

interface BookingScratchFormValues {
  shopId: string;
  date: string;
  serviceId: string;
}

const SHOP_OPTIONS = [{ value: '', label: 'Selecciona una sucursal' }, ...MOCK_SHOPS];
const SERVICE_OPTIONS = [{ value: '', label: 'Selecciona un servicio' }, ...MOCK_SERVICES];

/* Contenedor temporal con datos mock. Se reemplaza en la tarea
   "Crear contenedor, página y ruta del flujo de reserva". */
export function BookingScratchContainer() {
  const today = getTodayIso();

  const {
    register,
    watch,
    formState: { errors },
  } = useForm<BookingScratchFormValues>({
    mode: 'onChange',
    defaultValues: { shopId: '', date: '', serviceId: '' },
  });

  // Estado de la selección (react-hook-form es el estado local de este flujo)
  const { shopId, date, serviceId } = watch();
  const shopLabel = MOCK_SHOPS.find((s) => s.value === shopId)?.label;
  const serviceLabel = MOCK_SERVICES.find((s) => s.value === serviceId)?.label;

  return (
    <div className="flex w-full max-w-md flex-col gap-5 rounded-xl border border-[#2c2c2c] bg-[#1a1a1a] p-6">
      <SelectField
        id="booking-shop"
        label="Sucursal"
        options={SHOP_OPTIONS}
        registerProps={register('shopId')}
      />

      <DateField
        id="booking-date"
        label="Fecha"
        min={today}
        error={errors.date?.message}
        // `min` bloquea el calendario, pero la fecha también se puede teclear: se valida aquí.
        registerProps={register('date', {
          validate: (value) => {
            if (!value) return true;
            if (!isValidDisplayDate(value)) return 'Usa el formato dd/mm/aaaa.';
            return displayToIsoDate(value) >= today || 'La fecha no puede ser anterior a hoy.';
          },
        })}
      />

      <SelectField
        id="booking-service"
        label="Servicio"
        options={SERVICE_OPTIONS}
        registerProps={register('serviceId')}
      />

      <div className="border-t border-white/10 pt-4 text-sm text-(--text)">
        <p>
          Sucursal: <span className="text-(--text-h)">{shopLabel ?? '—'}</span>
        </p>
        <p>
          Fecha: <span className="text-(--text-h)">{date || '—'}</span>
        </p>
        <p>
          Servicio: <span className="text-(--text-h)">{serviceLabel ?? '—'}</span>
        </p>
      </div>
    </div>
  );
}
