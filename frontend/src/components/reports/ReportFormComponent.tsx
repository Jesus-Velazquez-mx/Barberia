import type { FieldErrors, UseFormRegisterReturn } from 'react-hook-form';
import { FileChartColumn } from 'lucide-react';
import { Button } from '../common/ButtonComponent';
import { DateField } from '../common/DateFieldComponent';
import { InputField } from '../common/InputFieldComponent';
import { SelectField, type SelectOption } from '../common/SelectFieldComponent';
import type { ReportFormValues } from '../../types/reportType';
import { REPORT_NAME_MAX } from '../../utils/reportUtils';

interface ReportFormProps {
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  /* Un registro de react-hook-form por campo (las reglas de validación viven en el contenedor). */
  fields: Record<keyof ReportFormValues, UseFormRegisterReturn>;
  errors: FieldErrors<ReportFormValues>;
  shopOptions: SelectOption[];
  /* Sin sucursales cargadas no se puede generar el reporte. */
  isDisabled: boolean;
  isSubmitting: boolean;
}

export function ReportForm({ onSubmit, fields, errors, shopOptions, isDisabled, isSubmitting }: ReportFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-label="Datos del reporte de desempeño"
      className="rounded-xl border border-white/10 bg-[#1A1A1A] p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <InputField
            id="report-first-name"
            type="text"
            label="Nombre(s) del barbero"
            placeholder="Todos"
            autoComplete="off"
            maxLength={REPORT_NAME_MAX}
            error={errors.firstName?.message}
            registerProps={fields.firstName}
          />
        </div>

        <div className="lg:col-span-2">
          <InputField
            id="report-last-name"
            type="text"
            label="Apellido(s) del barbero"
            placeholder="Todos"
            autoComplete="off"
            maxLength={REPORT_NAME_MAX}
            error={errors.lastName?.message}
            registerProps={fields.lastName}
          />
        </div>

        <div className="sm:col-span-2">
          <SelectField
            id="report-shop"
            label="Sucursal a evaluar *"
            options={shopOptions}
            disabled={isDisabled}
            error={errors.shopId?.message}
            registerProps={fields.shopId}
          />
        </div>

        <div className="lg:col-span-3">
          <DateField
            id="report-start-date"
            label="Fecha de inicio *"
            min=""
            error={errors.startDate?.message}
            registerProps={fields.startDate}
          />
        </div>

        <div className="lg:col-span-3">
          <DateField
            id="report-end-date"
            label="Fecha de fin *"
            min=""
            error={errors.endDate?.message}
            registerProps={fields.endDate}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-[var(--text)]">
          Deja el nombre y los apellidos vacíos para evaluar a todos los barberos de la sucursal.
        </p>

        <Button
          type="submit"
          isLoading={isSubmitting}
          loadingText="Generando..."
          disabled={isDisabled || isSubmitting}
          className="inline-flex items-center gap-2 px-4 !text-sm !font-semibold !normal-case disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FileChartColumn size={18} aria-hidden="true" />
          Generar reporte
        </Button>
      </div>
    </form>
  );
}
