import { useForm } from 'react-hook-form';
import { SelectField } from '../components/SelectFieldComponent';
import { DateField } from '../components/DateFieldComponent';
import { MOCK_SHOPS, MOCK_SERVICES } from '../mocks/bookingMock';

interface BookingScratchFormValues {
  shopId: string;
  date: string;
  serviceId: string;
}

// Fecha local de hoy en YYYY-MM-DD. No usar toISOString() directo: devuelve la
// fecha UTC y por la noche (hora de México) ya marcaría "mañana" como mínimo.
const getTodayLocal = (): string => {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().split('T')[0];
};

const SHOP_OPTIONS = [{ value: '', label: 'Selecciona una sucursal' }, ...MOCK_SHOPS];
const SERVICE_OPTIONS = [{ value: '', label: 'Selecciona un servicio' }, ...MOCK_SERVICES];

/* Contenedor temporal con datos mock. Se reemplaza en la tarea
   "Crear contenedor, página y ruta del flujo de reserva". */
export function BookingScratchContainer() {
  const today = getTodayLocal();

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
        // `min` bloquea el calendario, pero en algunos navegadores aún se puede
        // teclear una fecha pasada: también se valida aquí.
        registerProps={register('date', {
          validate: (value) => !value || value >= today || 'La fecha no puede ser anterior a hoy.',
        })}
      />

      <SelectField
        id="booking-service"
        label="Servicio"
        options={SERVICE_OPTIONS}
        registerProps={register('serviceId')}
      />

      <div className="border-t border-white/10 pt-4 text-sm text-[var(--text)]">
        <p>
          Sucursal: <span className="text-[var(--text-h)]">{shopLabel ?? '—'}</span>
        </p>
        <p>
          Fecha: <span className="text-[var(--text-h)]">{date || '—'}</span>
        </p>
        <p>
          Servicio: <span className="text-[var(--text-h)]">{serviceLabel ?? '—'}</span>
        </p>
      </div>
    </div>
  );
}
