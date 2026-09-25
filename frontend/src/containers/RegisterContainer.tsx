import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { register as registerUser } from '../services/authService';
import { ApiError } from '../types/api';
import type { RegisterFormValues } from '../types/auth';
import { RegisterForm } from '../components/RegisterFormComponent';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RegisterFormContainer() {
  const navigate = useNavigate();
  /* Importación nombrada para evitar choques de nombres */
  const { login: loginContext } = useAuth();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>();

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError('');

    try {
      const response = await registerUser(values);
      loginContext(response); // El backend regresa token de una vez: login automático
      navigate('/');
    } catch (error) {
      let errorMessage = 'No se pudo completar el registro';

      if (error instanceof ApiError) {
        if (error.status === 409) {
          errorMessage = 'Este correo ya está registrado';
        } else if (error.status === 400 && error.errors.length > 0) {
          errorMessage = error.errors.toString();
        } else {
          errorMessage = error.message;
        }
      }

      setServerError(errorMessage);
    }
  };

  return (
    <RegisterForm
      onSubmit={handleSubmit(onSubmit)}
      nameRegister={register('firstName', {
        required: 'El nombre es obligatorio.',
        minLength: { value: 2, message: 'Debe tener al menos 2 caracteres.' },
      })}
      lastnameRegister={register('lastName', {
        required: 'El apellido es obligatorio.',
        minLength: { value: 2, message: 'Debe tener al menos 2 caracteres.' },
      })}
      phoneRegister={register('phone', {
        maxLength: { value: 10, message: 'Máximo 10 dígitos.' },
        pattern: { value: /^\d*$/, message: 'Solo se permiten números.' },
      })}
      emailRegister={register('email', {
        required: 'El correo es obligatorio.',
        pattern: {
          value: /\S+@\S+\.\S+/,
          message: 'El correo no es válido.',
        },
      })}
      passwordRegister={register('password', {
        required: 'La contraseña es obligatoria.',
        minLength: { value: 6, message: 'Debe tener al menos 6 caracteres.' },
      })}
      confirmPasswordRegister={register('confirmPassword', {
        required: 'Confirma tu contraseña.',
        validate: (value) =>
          value === watch('password') || 'Las contraseñas no coinciden.',
      })}
      nameError={errors.firstName}
      lastnameError={errors.lastName}
      phoneError={errors.phone}
      emailError={errors.email}
      passwordError={errors.password}
      confirmPasswordError={errors.confirmPassword}
      serverError={serverError}
      isSubmitting={isSubmitting}
    />
  );
}
