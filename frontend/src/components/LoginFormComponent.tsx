import { Link } from 'react-router-dom';
import type { FieldError, UseFormRegisterReturn } from 'react-hook-form';
import { InputField } from './InputFieldComponent';
import { Button } from './ButtonComponent';

interface LoginFormProps {
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  emailRegister: UseFormRegisterReturn;
  passwordRegister: UseFormRegisterReturn;
  emailError?: FieldError;
  passwordError?: FieldError;
  serverError: string;
  isSubmitting: boolean;
}

export function LoginForm({
  onSubmit,
  emailRegister,
  passwordRegister,
  emailError,
  passwordError,
  serverError,
  isSubmitting,
}: LoginFormProps) {
  return (
    <form className="flex w-full flex-col gap-5" onSubmit={onSubmit} noValidate>
      <InputField
        id="email"
        type="email"
        label="Correo Electrónico"
        placeholder="correo@ejemplo.com"
        error={emailError?.message}
        registerProps={emailRegister}
      />

      <InputField
        id="password"
        type="password"
        label="Contraseña"
        placeholder="Ingresa tu contraseña"
        error={passwordError?.message}
        registerProps={passwordRegister}
      />

      {serverError && (
        <p className="text-center text-[0.85rem] font-semibold text-[#ff4d4d]" role="alert">
          {serverError}
        </p>
      )}

      <Link
        to="/forgot-password"
        className="block w-full text-right text-[0.9rem] font-medium text-[var(--accent)] no-underline hover:text-[var(--accent_secondary)] hover:underline"
      >
        ¿Olvidaste tu contraseña?
      </Link>

      <Button type="submit" isLoading={isSubmitting} loadingText="Ingresando...">
        Iniciar Sesión
      </Button>

      <p className="m-0 mb-0 self-center text-center text-[0.9rem]">
        ¿Aún no tienes una cuenta con nosotros?{' '}
        <Link
          to="/register"
          className="font-[Inter,sans-serif] font-bold text-[var(--accent)] no-underline hover:text-[var(--accent_secondary)] hover:underline"
        >
          Regístrate
        </Link>
      </p>
    </form>
  );
}
