import { Link } from 'react-router-dom';
import type { FieldError, UseFormRegisterReturn } from 'react-hook-form';
import { InputField } from './InputFieldComponent';
import { Button } from './ButtonComponent';

interface RegisterFormProps {
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  nameRegister: UseFormRegisterReturn;
  lastnameRegister: UseFormRegisterReturn;
  phoneRegister: UseFormRegisterReturn;
  emailRegister: UseFormRegisterReturn;
  passwordRegister: UseFormRegisterReturn;
  confirmPasswordRegister: UseFormRegisterReturn;
  nameError?: FieldError;
  lastnameError?: FieldError;
  phoneError?: FieldError;
  emailError?: FieldError;
  passwordError?: FieldError;
  confirmPasswordError?: FieldError;
  serverError: string;
  isSubmitting: boolean;
}

export function RegisterForm({
  onSubmit,
  nameRegister,
  lastnameRegister,
  phoneRegister,
  emailRegister,
  passwordRegister,
  confirmPasswordRegister,
  nameError,
  lastnameError,
  phoneError,
  emailError,
  passwordError,
  confirmPasswordError,
  serverError,
  isSubmitting,
}: RegisterFormProps) {
  return (
    <form className="flex w-full flex-col gap-5" onSubmit={onSubmit} noValidate>
      <InputField
        id="name"
        type="text"
        label="Nombres *"
        placeholder="Luis Fernando"
        error={nameError?.message}
        registerProps={nameRegister}
      />

      <InputField
        id="lastname"
        type="text"
        label="Apellidos *"
        placeholder="Payán López"
        error={lastnameError?.message}
        registerProps={lastnameRegister}
      />

      <InputField
        id="phone"
        type="tel"
        label="Teléfono"
        placeholder="6674210993"
        error={phoneError?.message}
        registerProps={phoneRegister}
      />

      <InputField
        id="email"
        type="email"
        label="Correo electrónico *"
        placeholder="correo@ejemplo.com"
        error={emailError?.message}
        registerProps={emailRegister}
      />

      <InputField
        id="password"
        type="password"
        label="Contraseña *"
        placeholder="Ingresa tu contraseña"
        error={passwordError?.message}
        registerProps={passwordRegister}
      />

      <InputField
        id="confirmPassword"
        type="password"
        label="Confirmar Contraseña *"
        placeholder="Confirma tu contraseña"
        error={confirmPasswordError?.message}
        registerProps={confirmPasswordRegister}
      />

      {serverError && (
        <p className="text-center text-[0.85rem] font-semibold text-[#ff4d4d]" role="alert">
          {serverError}
        </p>
      )}

      <Button type="submit" isLoading={isSubmitting} loadingText="Registrando...">
        Registrarse
      </Button>

      <p className="m-0 mb-0 self-center text-center text-[0.9rem]">
        ¿Ya tienes cuenta con nosotros?{' '}
        <Link
          to="/login"
          className="font-[Inter,sans-serif] font-bold text-[var(--accent)] no-underline hover:text-[var(--accent_secondary)] hover:underline"
        >
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
