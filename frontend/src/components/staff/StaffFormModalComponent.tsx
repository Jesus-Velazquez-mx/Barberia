import type { FieldErrors, UseFormRegisterReturn } from 'react-hook-form';
import { FormModal } from '../common/FormModalComponent';
import { InputField } from '../common/InputFieldComponent';
import { SelectField, type SelectOption } from '../common/SelectFieldComponent';
import type { StaffFormValues, StaffRole } from '../../types/staffType';
import { STAFF_ROLE_OPTIONS } from '../../utils/staffOptions';

interface StaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  mode: 'create' | 'edit';
  /* Rol elegido en el formulario; decide si el correo es obligatorio y si se pide contraseña. */
  role: StaffRole;
  shopOptions: SelectOption[];
  shiftOptions: SelectOption[];
  fullNameRegister: UseFormRegisterReturn;
  phoneRegister: UseFormRegisterReturn;
  emailRegister: UseFormRegisterReturn;
  roleRegister: UseFormRegisterReturn;
  shopRegister: UseFormRegisterReturn;
  shiftRegister: UseFormRegisterReturn;
  passwordRegister: UseFormRegisterReturn;
  errors: FieldErrors<StaffFormValues>;
  serverError: string;
  isSubmitting: boolean;
}

export function StaffFormModal({
  isOpen,
  onClose,
  onSubmit,
  mode,
  role,
  shopOptions,
  shiftOptions,
  fullNameRegister,
  phoneRegister,
  emailRegister,
  roleRegister,
  shopRegister,
  shiftRegister,
  passwordRegister,
  errors,
  serverError,
  isSubmitting
}: StaffFormModalProps) {
  const isEdit = mode === 'edit';
  /* La contraseña solo se pide al dar de alta a un recepcionista; los barberos no inician sesión. */
  const showPassword = !isEdit && role === 'receptionist';

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title={isEdit ? 'Editar personal' : 'Registrar nuevo personal'}
      description={isEdit ? 'Modifica la información del personal.' : 'Ingresa los datos para dar de alta al personal.'}
      submitLabel={isEdit ? 'Actualizar Personal' : 'Guardar Personal'}
      loadingLabel={isEdit ? 'Actualizando...' : 'Guardando...'}
      serverError={serverError}
      isSubmitting={isSubmitting}
    >
      <InputField
        id="staffFullName"
        type="text"
        label="Nombre Completo *"
        placeholder="Carlos Mendoza"
        autoComplete="off"
        error={errors.fullName?.message}
        registerProps={fullNameRegister}
      />

      <InputField
        id="staffPhone"
        type="tel"
        label="Teléfono *"
        placeholder="667 123 4567"
        autoComplete="off"
        error={errors.phone?.message}
        registerProps={phoneRegister}
      />

      <InputField
        id="staffEmail"
        type="email"
        label={role === 'receptionist' ? 'Correo Electrónico *' : 'Correo Electrónico'}
        placeholder="nombre@ejemplo.com"
        autoComplete="off"
        error={errors.email?.message}
        registerProps={emailRegister}
      />

      <SelectField
        id="staffRole"
        label="Rol en el sistema *"
        options={STAFF_ROLE_OPTIONS}
        disabled={isEdit}
        error={errors.role?.message}
        registerProps={roleRegister}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          id="staffShop"
          label="Sucursal *"
          options={[{ value: '', label: 'Selecciona una sucursal' }, ...shopOptions]}
          error={errors.shopId?.message}
          registerProps={shopRegister}
        />

        <SelectField
          id="staffShift"
          label="Turno *"
          options={[{ value: '', label: 'Selecciona un turno' }, ...shiftOptions]}
          error={errors.shiftId?.message}
          registerProps={shiftRegister}
        />
      </div>

      {showPassword && (
        <InputField
          id="staffPassword"
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
