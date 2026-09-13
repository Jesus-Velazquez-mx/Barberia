import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { login } from '../services/authService';
import { ApiError } from '../types/api';
import type { LoginFormValues } from '../types/auth';

import { LoginForm } from '../components/loginFormComponent';

import { useNavigate } from 'react-router-dom';

export function LoginFormContainer() {
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
          error.status === 404 ||
          error.message === 'User not found or invalid credentials'
            ? 'Correo o contraseña incorrectos'
            : error.message;
      }

      setServerError(errorMessage);
    }
  };

  return (
    <LoginForm
      onSubmit={handleSubmit(onSubmit)}
      emailRegister={register('email', {
        required: 'El correo es obligatorio.',
        pattern: {
          value: /\S+@\S+\.\S+/,
          message: 'El correo no es válido.',
        },
      })}
      passwordRegister={register('password', {
        required: 'La contraseña es obligatoria.',
      })}
      emailError={errors.email}
      passwordError={errors.password}
      serverError={serverError}
      isSubmitting={isSubmitting}
    />
  );
}