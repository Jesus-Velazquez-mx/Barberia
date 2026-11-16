import type { FieldErrors, UseFormRegisterReturn } from 'react-hook-form';
import { DateField } from '../common/DateFieldComponent';
import { FormModal } from '../common/FormModalComponent';
import { InputField } from '../common/InputFieldComponent';
import { SelectField } from '../common/SelectFieldComponent';
import type { ClientFormValues } from '../../types/clientType';
import { getTodayIso } from '../../utils/dateFormat';
import { GENDER_OPTIONS } from '../../utils/genderOptions';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  mode: 'create' | 'edit';
  fullNameRegister: UseFormRegisterReturn;
  phoneRegister: UseFormRegisterReturn;
  emailRegister: UseFormRegisterReturn;
  birthDateRegister: UseFormRegisterReturn;
  genderRegister: UseFormRegisterReturn;
  passwordRegister: UseFormRegisterReturn;
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
  birthDateRegister,
  genderRegister,
  passwordRegister,
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

      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <DateField
          id="clientBirthDate"
          label="Fecha de Nacimiento *"
          min="1900-01-01"
          max={getTodayIso()}
          error={errors.birthDate?.message}
          registerProps={birthDateRegister}
        />

        <SelectField
          id="clientGender"
          label="Género *"
          options={[{ value: '', label: 'Selecciona un género' }, ...GENDER_OPTIONS]}
          error={errors.gender?.message}
          registerProps={genderRegister}
        />
      </div>

      {!isEdit && (
        <InputField
          id="clientPassword"
          type="password"
          label="Contraseña *"
          placeholder="Mínimo 6 caracteres"
          autoComplete="new-password"
          error={errors.password?.message}
          registerProps={passwordRegister}
        />
      )}
    </FormModal>
  );
}
