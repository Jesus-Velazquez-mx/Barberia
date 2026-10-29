import { ChevronDown, Funnel, RotateCcw } from 'lucide-react';
import type { FieldErrors, UseFormRegisterReturn } from 'react-hook-form';
import type { AppointmentFilterValues } from '../../types/appointmentType';
import { DateField } from '../common/DateFieldComponent';
import { SelectField, type SelectOption } from '../common/SelectFieldComponent';

export const FILTERS_PANEL_ID = 'appointments-filters-panel';

interface FilterToggleButtonProps {
  isOpen: boolean;
  /* Filtros del panel distintos de su valor por defecto. */
  activeCount: number;
  onClick: () => void;
}

/* Botón "Filtros" que abre y cierra el panel; se coloca junto a la barra de búsqueda. */
export function FilterToggleButton({ isOpen, activeCount, onClick }: FilterToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={isOpen}
      aria-controls={FILTERS_PANEL_ID}
      className={`inline-flex h-12 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-5 text-sm font-semibold text-[var(--text-h)] transition-colors hover:border-[var(--accent)]/60 ${
        isOpen ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-white/10 bg-[#262626]'
      }`}
    >
      <Funnel size={16} aria-hidden="true" />
      Filtros
      {activeCount > 0 && (
        <span
          className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1.5 text-xs font-bold text-black"
          aria-label={`${activeCount} ${activeCount === 1 ? 'filtro activo' : 'filtros activos'}`}
        >
          {activeCount}
        </span>
      )}
      <ChevronDown size={16} aria-hidden="true" className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </button>
  );
}

type DateFilterKey = 'serviceFrom' | 'serviceTo' | 'createdFrom' | 'createdTo';

interface AppointmentFiltersProps {
  isOpen: boolean;
  /* Un registro de react-hook-form por filtro (las reglas de validación viven en el contenedor). */
  fields: Pick<Record<keyof AppointmentFilterValues, UseFormRegisterReturn>, DateFilterKey> &
    Partial<Record<Exclude<keyof AppointmentFilterValues, DateFilterKey>, UseFormRegisterReturn>>;
  errors: FieldErrors<AppointmentFilterValues>;
  /* Solo el manager lo recibe; sin opciones (recepción) o con una sola sucursal el filtro no se muestra. */
  shopOptions?: SelectOption[];
  /* Sin opciones (cliente) el filtro de servicio no se muestra. */
  serviceOptions?: SelectOption[];
  /* Sin opciones (cliente) el filtro de estado no se muestra. */
  statusOptions?: SelectOption[];
  /* Hay búsqueda o algún filtro distinto del valor por defecto. */
  canReset: boolean;
  onReset: () => void;
}

export function AppointmentFilters({
  isOpen,
  fields,
  errors,
  shopOptions,
  serviceOptions,
  statusOptions,
  canReset,
  onReset
}: AppointmentFiltersProps) {
  return (
    <section
      id={FILTERS_PANEL_ID}
      aria-label="Filtros de citas"
      hidden={!isOpen}
      className="rounded-xl border border-white/10 bg-[#1A1A1A] p-5"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 flex items-center gap-2 font-sans text-base font-bold tracking-normal text-[var(--text-h)]">
          <Funnel size={18} aria-hidden="true" />
          Filtros
        </h2>

        <button
          type="button"
          onClick={onReset}
          disabled={!canReset}
          className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-[#262626] px-3 text-xs font-semibold text-[var(--text-h)] transition-colors hover:border-[var(--accent)]/60 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/10"
        >
          <RotateCcw size={14} aria-hidden="true" />
          Restablecer filtros
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DateField
          id="appointments-service-from"
          label="Fecha de servicio (desde)"
          min=""
          error={errors.serviceFrom?.message}
          registerProps={fields.serviceFrom}
        />
        <DateField
          id="appointments-service-to"
          label="Fecha de servicio (hasta)"
          min=""
          error={errors.serviceTo?.message}
          registerProps={fields.serviceTo}
        />
        <DateField
          id="appointments-created-from"
          label="Fecha de creación (desde)"
          min=""
          error={errors.createdFrom?.message}
          registerProps={fields.createdFrom}
        />
        <DateField
          id="appointments-created-to"
          label="Fecha de creación (hasta)"
          min=""
          error={errors.createdTo?.message}
          registerProps={fields.createdTo}
        />

        {shopOptions && shopOptions.length > 2 && fields.shopId && (
          <SelectField id="appointments-shop" label="Sucursal" options={shopOptions} registerProps={fields.shopId} />
        )}
        {serviceOptions && fields.serviceId && (
          <SelectField
            id="appointments-service"
            label="Servicio"
            options={serviceOptions}
            registerProps={fields.serviceId}
          />
        )}
        {statusOptions && fields.status && (
          <SelectField id="appointments-status" label="Estado" options={statusOptions} registerProps={fields.status} />
        )}
      </div>
    </section>
  );
}
