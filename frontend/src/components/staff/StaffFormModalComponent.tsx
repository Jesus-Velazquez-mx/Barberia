import type { FieldErrors, UseFormRegisterReturn } from 'react-hook-form';
import { Button } from '../common/ButtonComponent';
import { DateField } from '../common/DateFieldComponent';
import { FormModal } from '../common/FormModalComponent';
import { InputField } from '../common/InputFieldComponent';
import { SelectField, type SelectOption } from '../common/SelectFieldComponent';
import type { StaffFormValues, StaffMember, StaffRole } from '../../types/staffType';
import { getTodayIso } from '../../utils/dateFormat';
import { GENDER_OPTIONS } from '../../utils/genderOptions';
import { joinFullName } from '../../utils/personUtils';
import { STAFF_ROLE_LABELS, STAFF_ROLE_OPTIONS } from '../../utils/staffOptions';

interface StaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  mode: 'create' | 'edit';
  /* Rol elegido en el formulario; decide si se pide contraseña. */
  role: StaffRole;
  shopOptions: SelectOption[];
  shiftOptions: SelectOption[];
  fullNameRegister: UseFormRegisterReturn;
  phoneRegister: UseFormRegisterReturn;
  emailRegister: UseFormRegisterReturn;
  birthDateRegister: UseFormRegisterReturn;
  genderRegister: UseFormRegisterReturn;
  roleRegister: UseFormRegisterReturn;
  shopRegister: UseFormRegisterReturn;
  shiftRegister: UseFormRegisterReturn;
  passwordRegister: UseFormRegisterReturn;
  /* Integrante inactivo cuyo correo coincide con lo que se escribió en el campo de email. */
  inactiveEmailMatch?: StaffMember | null;
  onReactivate?: () => void;
  isReactivating?: boolean;
  reactivatePassword?: string;
  onReactivatePasswordChange?: (value: string) => void;
  reactivatePasswordError?: string;
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
  birthDateRegister,
  genderRegister,
  roleRegister,
  shopRegister,
  shiftRegister,
  passwordRegister,
  inactiveEmailMatch,
  onReactivate,
  isReactivating = false,
  reactivatePassword = '',
  onReactivatePasswordChange,
  reactivatePasswordError = '',
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

      <div className="grid gap-4 sm:grid-cols-2">
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
          label="Correo Electrónico *"
          placeholder="nombre@ejemplo.com"
          autoComplete="off"
          error={errors.email?.message}
          registerProps={emailRegister}
        />
      </div>

      {inactiveEmailMatch && onReactivate && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[0.85rem] text-amber-200"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="m-0 font-semibold text-amber-300">
                Este correo ya está registrado a nombre de {joinFullName(inactiveEmailMatch)} (
                {STAFF_ROLE_LABELS[inactiveEmailMatch.role].toLowerCase()} inactivo).
              </p>
              <p className="m-0 mt-0.5 text-amber-200/90">
                {inactiveEmailMatch.role === 'receptionist'
                  ? '¿Te gustaría reactivarlo? Asigna una nueva contraseña para reactivar su cuenta:'
                  : '¿Te gustaría reactivarlo sin necesidad de llenar el resto del formulario?'}
              </p>
            </div>
            {inactiveEmailMatch.role === 'barber' && (
              <Button
                type="button"
                onClick={onReactivate}
                isLoading={isReactivating}
                loadingText="Reactivando..."
                className="!h-9 shrink-0 !px-4 !text-xs !font-semibold !normal-case"
              >
                Sí, reactivar
              </Button>
            )}
          </div>

          {inactiveEmailMatch.role === 'receptionist' && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <div className="flex-1">
                <input
                  id="reactivateReceptionistPassword"
                  type="password"
                  value={reactivatePassword}
                  onChange={(event) => onReactivatePasswordChange?.(event.target.value)}
                  placeholder="Nueva contraseña (mínimo 6 caracteres)"
                  autoComplete="new-password"
                  aria-label="Nueva contraseña para reactivar recepcionista"
                  aria-invalid={Boolean(reactivatePasswordError)}
                  className={`h-9 w-full rounded-lg border bg-[#1A1A1A] px-3 text-sm text-[var(--text-h)] placeholder:text-white/40 focus:outline-none ${
                    reactivatePasswordError
                      ? 'border-[#ff4d4d] focus:border-[#ff4d4d]'
                      : 'border-white/15 focus:border-[var(--accent)]'
                  }`}
                />
                {reactivatePasswordError && (
                  <p className="m-0 mt-1 text-xs font-medium text-[#ff4d4d]">{reactivatePasswordError}</p>
                )}
              </div>
              <Button
                type="button"
                onClick={onReactivate}
                isLoading={isReactivating}
                loadingText="Reactivando..."
                className="!h-9 shrink-0 !px-4 !text-xs !font-semibold !normal-case"
              >
                Sí, reactivar
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <DateField
          id="staffBirthDate"
          label="Fecha de Nacimiento *"
          min="1900-01-01"
          max={getTodayIso()}
          error={errors.birthDate?.message}
          registerProps={birthDateRegister}
        />

        <SelectField
          id="staffGender"
          label="Género *"
          options={[{ value: '', label: 'Selecciona un género' }, ...GENDER_OPTIONS]}
          error={errors.gender?.message}
          registerProps={genderRegister}
        />
      </div>

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
