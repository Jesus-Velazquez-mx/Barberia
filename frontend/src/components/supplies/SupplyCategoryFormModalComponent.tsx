import type { FieldErrors, UseFormRegisterReturn } from 'react-hook-form';
import { FormModal } from '../common/FormModalComponent';
import { InputField } from '../common/InputFieldComponent';
import type { SupplyCategoryFormValues } from '../../types/supplyCategoryType';

interface SupplyCategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  mode: 'create' | 'edit';
  nameRegister: UseFormRegisterReturn;
  descriptionRegister: UseFormRegisterReturn;
  errors: FieldErrors<SupplyCategoryFormValues>;
  serverError: string;
  isSubmitting: boolean;
}

export function SupplyCategoryFormModal({
  isOpen,
  onClose,
  onSubmit,
  mode,
  nameRegister,
  descriptionRegister,
  errors,
  serverError,
  isSubmitting
}: SupplyCategoryFormModalProps) {
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
        id="supplyCategoryName"
        type="text"
        label="Nombre *"
        placeholder="Herramientas"
        autoComplete="off"
        error={errors.name?.message}
        registerProps={nameRegister}
      />

      <InputField
        id="supplyCategoryDescription"
        type="text"
        label="Descripción"
        placeholder="Detalle opcional de la categoría"
        autoComplete="off"
        error={errors.description?.message}
        registerProps={descriptionRegister}
      />
    </FormModal>
  );
}
