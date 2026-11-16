import type { FieldErrors, UseFormRegisterReturn } from 'react-hook-form';
import { FormModal } from '../common/FormModalComponent';
import { InputField } from '../common/InputFieldComponent';
import { SelectField, type SelectOption } from '../common/SelectFieldComponent';
import type { OfferedServiceFormValues } from '../../types/offeredService';
import { ACTIVE_SELECT_OPTIONS } from '../../utils/offeredServiceUtils';

interface OfferedServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  mode: 'create' | 'edit';
  categoryOptions: SelectOption[];
  nameRegister: UseFormRegisterReturn;
  categoryRegister: UseFormRegisterReturn;
  durationRegister: UseFormRegisterReturn;
  priceRegister: UseFormRegisterReturn;
  descriptionRegister: UseFormRegisterReturn;
  isActiveRegister: UseFormRegisterReturn;
  errors: FieldErrors<OfferedServiceFormValues>;
  serverError: string;
  isSubmitting: boolean;
}

export function OfferedServiceFormModal({
  isOpen,
  onClose,
  onSubmit,
  mode,
  categoryOptions,
  nameRegister,
  categoryRegister,
  durationRegister,
  priceRegister,
  descriptionRegister,
  isActiveRegister,
  errors,
  serverError,
  isSubmitting
}: OfferedServiceFormModalProps) {
  const isEdit = mode === 'edit';

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title={isEdit ? 'Editar servicio' : 'Registrar nuevo servicio'}
      description={isEdit ? 'Modifica la información del servicio.' : 'Ingresa los datos del nuevo servicio.'}
      submitLabel={isEdit ? 'Actualizar Servicio' : 'Guardar Servicio'}
      loadingLabel={isEdit ? 'Actualizando...' : 'Guardando...'}
      serverError={serverError}
      isSubmitting={isSubmitting}
    >
      <InputField
        id="offeredServiceName"
        type="text"
        label="Nombre *"
        placeholder="Corte clásico"
        autoComplete="off"
        error={errors.name?.message}
        registerProps={nameRegister}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          id="offeredServiceCategory"
          label="Categoría *"
          options={[{ value: '', label: 'Selecciona una categoría' }, ...categoryOptions]}
          error={errors.categoryId?.message}
          registerProps={categoryRegister}
        />

        <SelectField
          id="offeredServiceStatus"
          label="Estado *"
          options={ACTIVE_SELECT_OPTIONS}
          error={errors.isActive?.message}
          registerProps={isActiveRegister}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          id="offeredServiceDuration"
          type="number"
          inputMode="numeric"
          min={1}
          step={5}
          label="Duración (minutos) *"
          placeholder="30"
          error={errors.durationMinutes?.message}
          registerProps={durationRegister}
        />

        <InputField
          id="offeredServicePrice"
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          label="Precio (MXN) *"
          placeholder="250.00"
          error={errors.price?.message}
          registerProps={priceRegister}
        />
      </div>

      <InputField
        id="offeredServiceDescription"
        type="text"
        label="Descripción"
        placeholder="Detalle opcional del servicio"
        autoComplete="off"
        error={errors.description?.message}
        registerProps={descriptionRegister}
      />
    </FormModal>
  );
}
