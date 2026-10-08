import type { FieldError, UseFormRegisterReturn } from 'react-hook-form';
import { InputField } from './InputFieldComponent';
import { DateField } from './DateFieldComponent';
import { SelectField } from './SelectFieldComponent';
import { Button } from './ButtonComponent';
import { Modal } from './ModalComponent';
import { GENDER_OPTIONS } from '../utils/genderOptions';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  firstNameRegister: UseFormRegisterReturn;
  lastNameRegister: UseFormRegisterReturn;
  phoneRegister: UseFormRegisterReturn;
  emailRegister: UseFormRegisterReturn;
  birthDateRegister: UseFormRegisterReturn;
  genderRegister: UseFormRegisterReturn;
  firstNameError?: FieldError;
  lastNameError?: FieldError;
  phoneError?: FieldError;
  emailError?: FieldError;
  birthDateError?: FieldError;
  genderError?: FieldError;
  serverError: string;
  isSubmitting: boolean;
}

export function EditUserModal({
  isOpen,
  onClose,
  onSubmit,
  firstNameRegister,
  lastNameRegister,
  phoneRegister,
  emailRegister,
  birthDateRegister,
  genderRegister,
  firstNameError,
  lastNameError,
  phoneError,
  emailError,
  birthDateError,
  genderError,
  serverError,
  isSubmitting
}: EditUserModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h2 className="m-0 text-xl font-semibold text-(--text-h)">Editar usuario</h2>
          <p className="mt-1 text-[0.9rem] text-(--text)">Modifica la información del usuario</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="text-(--text) transition-colors hover:text-(--text-h)"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <InputField
          id="firstName"
          type="text"
          label="Nombre *"
          placeholder="Ingresa tu nombre"
          error={firstNameError?.message}
          registerProps={firstNameRegister}
        />

        <InputField
          id="lastName"
          type="text"
          label="Apellido *"
          placeholder="Ingresa tu apellido"
          error={lastNameError?.message}
          registerProps={lastNameRegister}
        />

        <InputField
          id="phone"
          type="tel"
          label="Teléfono"
          placeholder="Ingresa tu número de teléfono"
          error={phoneError?.message}
          registerProps={phoneRegister}
        />

        <DateField
          id="birthDate"
          label="Fecha de nacimiento"
          min="1900-01-01"
          max={new Date().toISOString().slice(0, 10)}
          error={birthDateError?.message}
          registerProps={birthDateRegister}
        />

        <SelectField
          id="gender"
          label="Género"
          options={GENDER_OPTIONS}
          error={genderError?.message}
          registerProps={genderRegister}
        />

        <InputField
          id="email"
          type="email"
          label="Correo Electrónico *"
          placeholder="nombre@ejemplo.com"
          error={emailError?.message}
          registerProps={emailRegister}
        />

        {serverError && (
          <p className="text-center text-[0.85rem] font-semibold text-[#ff4d4d]" role="alert">
            {serverError}
          </p>
        )}

        {/* Sticky dentro del scroll del Modal; -mx-8/-mb-8 compensan su p-8 para que la barra llegue a los bordes */}
        <div className="sticky bottom-0 -mx-8 mt-2 flex justify-end gap-3 border-t border-white/10 bg-[#1E1E1E] px-8 pb-4 pt-4">
          <Button
            type="button"
            onClick={onClose}
            className="h-12! border! border-solid! border-(--text)! bg-transparent! px-8! normal-case! text-(--text)!"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            loadingText="Actualizando..."
            className="h-12! px-8! normal-case!"
          >
            Actualizar Usuario
          </Button>
        </div>
      </form>
    </Modal>
  );
}
