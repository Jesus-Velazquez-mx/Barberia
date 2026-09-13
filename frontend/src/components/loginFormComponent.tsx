import { Link } from 'react-router-dom';
import type { FieldError, UseFormRegisterReturn } from 'react-hook-form';

import { InputField } from './inputFieldComponent';
import { Button } from './buttonComponent';
import styles from '../styles/loginStyle.module.css';

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
    <form className={styles.loginForm} onSubmit={onSubmit} noValidate>
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
        <p className={styles.serverError} role="alert">
          {serverError}
        </p>
      )}

      <Link to="/forgot-password" className={styles.forgotPassword}>
        ¿Olvidaste tu contraseña?
      </Link>

      <Button type="submit" isLoading={isSubmitting} loadingText="Ingresando...">
        Iniciar Sesión
      </Button>

      <p>
        ¿Aún no tienes una cuenta con nosotros?{' '}
        <Link to="/register" className={styles.registerLink}>
          Regístrate
        </Link>
      </p>
    </form>
  );
}
