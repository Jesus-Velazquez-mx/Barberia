import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { updateUser } from '../services/userService';
import { ApiError } from '../types/api';
import type { EditUserFormValues, User } from '../types/auth';
import { EditUserModal } from '../components/EditUserModalComponent';
import { Toast } from '../components/ToastComponent';
import { useAuth } from '../context/AuthContext';

interface EditUserModalContainerProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (user: User) => void;
}

export function EditUserModalContainer({ user, isOpen, onClose, onUpdated }: EditUserModalContainerProps) {
  const { token } = useAuth();
  const [serverError, setServerError] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditUserFormValues>({
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? '',
      email: user.email,
    },
  });

  // Repuebla el formulario si cambia el usuario a editar mientras el modal sigue montado
  useEffect(() => {
    reset({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? '',
      email: user.email,
    });
  }, [user, reset]);

  const handleClose = () => {
    // Descarta los cambios sin guardar: vuelve a los últimos valores del usuario
    reset();
    setServerError('');
    onClose();
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    setServerError('');
    void handleSubmit(onSubmit)(event);
  };

  const onSubmit = async (values: EditUserFormValues) => {
    setServerError('');

    if (!token) {
      setServerError('Tu sesión expiró. Inicia sesión de nuevo.');
      return;
    }

    try {
      const updated = await updateUser(user.id, values, token);
      onUpdated(updated);
      // El modal ya cumplió su propósito: se cierra y el aviso vive como toast flotante.
      onClose();
      setToastMessage('Usuario actualizado correctamente.');
    } catch (error) {
      let errorMessage = 'No se pudo actualizar el usuario';

      if (error instanceof ApiError) {
        if (error.status === 409) {
          errorMessage = 'Este correo ya está en uso por otro usuario';
        } else if (error.status === 400 && error.errors.length > 0) {
          errorMessage = error.errors.join(' ');
        } else {
          errorMessage = error.message;
        }
      }

      setServerError(errorMessage);
    }
  };

  return (
    <>
      <EditUserModal
        isOpen={isOpen}
        onClose={handleClose}
        onSubmit={handleFormSubmit}
        firstNameRegister={register('firstName', {
          required: 'El nombre es obligatorio.',
          minLength: { value: 2, message: 'Debe tener al menos 2 caracteres.' },
        })}
        lastNameRegister={register('lastName', {
          required: 'El apellido es obligatorio.',
          minLength: { value: 2, message: 'Debe tener al menos 2 caracteres.' },
        })}
        phoneRegister={register('phone', {
          pattern: { value: /^\d{10}$/, message: 'Debe tener 10 dígitos.' },
        })}
        emailRegister={register('email', {
          required: 'El correo es obligatorio.',
          pattern: { value: /\S+@\S+\.\S+/, message: 'El correo no es válido.' },
        })}
        firstNameError={errors.firstName}
        lastNameError={errors.lastName}
        phoneError={errors.phone}
        emailError={errors.email}
        serverError={serverError}
        isSubmitting={isSubmitting}
      />

      <Toast message={toastMessage} type="success" onDismiss={() => setToastMessage(null)} />
    </>
  );
}
