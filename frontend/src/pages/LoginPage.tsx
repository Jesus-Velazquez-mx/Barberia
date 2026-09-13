import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';

import { login } from '../services/authService';
import { ApiError } from '../types/api';
import type { LoginFormValues } from '../types/auth';

import '../styles/loginStyle.css';

function LoginPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>();

  const onSubmit = async (values: LoginFormValues) => {
    setServerError('');

    try {
      const response = await login(values);

      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      navigate('/');
    } catch (error) {
      let errorMessage = 'No se pudo iniciar sesión';

      if (error instanceof ApiError) {
        errorMessage =
          error.message === 'Invalid email or password'
            ? 'Correo o contraseña incorrectos'
            : error.message;
      }

      setServerError(errorMessage);
    }
  };

  return (
    <div className="login-wrapper">
      <img
        src="/src/assets/logos/MrBarberLogo.png"
        alt="Logo MrBarber"
        className="logo"
      />

      <section className="login-container">
        <h2>Bienvenido de nuevo</h2>

        <p className="login-subtitle">
          Inicia sesión para ver tu cuenta
        </p>

        <form
          className="login-form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>

            <input
              id="email"
              type="email"
              placeholder="correo@ejemplo.com"
              className={errors.email ? 'input-error' : ''}
              {...register('email', {
                required: 'El correo es obligatorio.',
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: 'El correo no es válido.',
                },
              })}
            />

            {errors.email && (
              <span className="error-message">
                {errors.email.message}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>

            <input
              id="password"
              type="password"
              placeholder="Ingresa tu contraseña"
              className={errors.password ? 'input-error' : ''}
              {...register('password', {
                required: 'La contraseña es obligatoria.',
              })}
            />

            {errors.password && (
              <span className="error-message">
                {errors.password.message}
              </span>
            )}
          </div>

          {serverError && (
            <p className="server-error" role="alert">
              {serverError}
            </p>
          )}

          <Link to="/forgot-password" className="forgot-password">
            ¿Olvidaste tu contraseña?
          </Link>

          <button
            type="submit"
            className="login-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>

          <p>
            ¿Aún no tienes una cuenta con nosotros?{' '}
            <Link to="/register" className="register-link">
              Regístrate
            </Link>
          </p>
        </form>
      </section>
    </div>
  );
}

export default LoginPage;