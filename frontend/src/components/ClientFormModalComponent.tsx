import type { FieldErrors, UseFormRegisterReturn } from 'react-hook-form';
import { FormModal } from './FormModalComponent';
import { InputField } from './InputFieldComponent';
import type { ClientFormValues } from '../types/clientType';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  mode: 'create' | 'edit';
  fullNameRegister: UseFormRegisterReturn;
  phoneRegister: UseFormRegisterReturn;
  emailRegister: UseFormRegisterReturn;
  errors: FieldErrors<ClientFormValues>;
  serverError: string;
  isSubmitting: boolean;
}

export function ClientFormModal({
  isOpen,
  onClose,
  onSubmit,
  mode,
  fullNameRegister,
  phoneRegister,
  emailRegister,
  errors,
  serverError,
  isSubmitting
}: ClientFormModalProps) {
  const isEdit = mode === 'edit';

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title={isEdit ? 'Editar cliente' : 'Registrar nuevo cliente'}
      description={isEdit ? 'Modifica la información del cliente.' : 'Ingresa los datos para dar de alta al cliente.'}
      submitLabel={isEdit ? 'Actualizar Cliente' : 'Guardar Cliente'}
      loadingLabel={isEdit ? 'Actualizando...' : 'Guardando...'}
      serverError={serverError}
      isSubmitting={isSubmitting}
    >
      <InputField
        id="clientFullName"
        type="text"
        label="Nombre Completo *"
        placeholder="Carlos Mendoza"
        autoComplete="off"
        error={errors.fullName?.message}
        registerProps={fullNameRegister}
      />

      <InputField
        id="clientPhone"
        type="tel"
        label="Teléfono *"
        placeholder="667 123 4567"
        autoComplete="off"
        error={errors.phone?.message}
        registerProps={phoneRegister}
      />

      <InputField
        id="clientEmail"
        type="email"
        label="Correo Electrónico *"
        placeholder="nombre@ejemplo.com"
        autoComplete="off"
        error={errors.email?.message}
        registerProps={emailRegister}
      />
    </FormModal>
  );
}
