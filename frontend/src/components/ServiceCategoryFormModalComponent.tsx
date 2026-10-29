import type { FieldErrors, UseFormRegisterReturn } from 'react-hook-form';
import { FormModal } from './FormModalComponent';
import { InputField } from './InputFieldComponent';
import { SelectField } from './SelectFieldComponent';
import type { ServiceCategoryFormValues } from '../types/serviceCategoryType';
import { ACTIVE_SELECT_OPTIONS } from '../utils/offeredServiceUtils';

interface ServiceCategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  mode: 'create' | 'edit';
  nameRegister: UseFormRegisterReturn;
  descriptionRegister: UseFormRegisterReturn;
  isActiveRegister: UseFormRegisterReturn;
  /* Aviso cuando el manager está por desactivar una categoría que tiene servicios activos. */
  deactivationWarning: string | null;
  errors: FieldErrors<ServiceCategoryFormValues>;
  serverError: string;
  isSubmitting: boolean;
}

export function ServiceCategoryFormModal({
  isOpen,
  onClose,
  onSubmit,
  mode,
  nameRegister,
  descriptionRegister,
  isActiveRegister,
  deactivationWarning,
  errors,
  serverError,
  isSubmitting
}: ServiceCategoryFormModalProps) {
  const isEdit = mode === 'edit';

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title={isEdit ? 'Editar categoría' : 'Registrar nueva categoría'}
      description={isEdit ? 'Modifica la información de la categoría.' : 'Ingresa los datos de la nueva categoría.'}
      submitLabel={isEdit ? 'Actualizar Categoría' : 'Guardar Categoría'}
      loadingLabel={isEdit ? 'Actualizando...' : 'Guardando...'}
      serverError={serverError}
      isSubmitting={isSubmitting}
    >
      <InputField
        id="serviceCategoryName"
        type="text"
        label="Nombre *"
        placeholder="Cortes de cabello"
        autoComplete="off"
        error={errors.name?.message}
        registerProps={nameRegister}
      />

      <InputField
        id="serviceCategoryDescription"
        type="text"
        label="Descripción"
        placeholder="Detalle opcional de la categoría"
        autoComplete="off"
        error={errors.description?.message}
        registerProps={descriptionRegister}
      />

      <SelectField
        id="serviceCategoryStatus"
        label="Estado *"
        options={ACTIVE_SELECT_OPTIONS}
        error={errors.isActive?.message}
        registerProps={isActiveRegister}
      />

      {deactivationWarning && (
        <p
          role="alert"
          className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[0.85rem] text-amber-300"
        >
          {deactivationWarning}
        </p>
      )}
    </FormModal>
  );
}
