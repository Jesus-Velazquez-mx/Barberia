import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { updateUser, type UpdateUserValues } from '../services/userService';
import { ApiError } from '../types/api';
import type { EditUserFormValues, User } from '../types/auth';
import { EditUserModal } from '../components/EditUserModalComponent';
import { Toast } from '../components/ToastComponent';
import { useAuth } from '../context/AuthContext';
import { displayToIsoDate, getTodayIso, isoToDisplayDate, isValidDisplayDate } from '../utils/dateFormat';

interface EditUserModalContainerProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (user: User) => void;
}

/* El campo de fecha usa dd/mm/aaaa; el backend regresa la fecha completa en ISO. */
const toDateInputValue = isoToDisplayDate;

export function EditUserModalContainer({ user, isOpen, onClose, onUpdated }: EditUserModalContainerProps) {
  const { token } = useAuth();
  const [serverError, setServerError] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<EditUserFormValues>({
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? '',
      email: user.email,
      birthDate: toDateInputValue(user.birthDate),
      gender: user.gender,
    },
  });

  // Repuebla el formulario si cambia el usuario a editar mientras el modal sigue montado
  useEffect(() => {
    reset({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? '',
      email: user.email,
      birthDate: toDateInputValue(user.birthDate),
      gender: user.gender,
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

   const phone = values.phone?.trim();

 const payload: UpdateUserValues = {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    ...(dirtyFields.email && { email: values.email.trim() }),
    ...(dirtyFields.phone && { phone: phone ? phone : null }),
    ...(dirtyFields.birthDate && values.birthDate && { birthDate: displayToIsoDate(values.birthDate) }),
    ...(dirtyFields.gender && values.gender && { gender: values.gender }),
};
    console.log(dirtyFields, payload)
    try {
      const updated = await updateUser(user.id, payload, token);
      onUpdated(updated);
      // El modal ya cumplió su propósito: se cierra y el aviso vive como toast flotante.
      onClose();
      setToastMessage('Usuario actualizado correctamente.');
    } catch (error) {
      let errorMessage = 'No se pudo actualizar el usuario';

      if (error instanceof ApiError) {
        if (error.status === 400 && error.errors.length > 0) {
          errorMessage = error.errors.map((e: unknown) =>
          typeof e === 'string' ? e : (e as { message?: string }).message ?? JSON.stringify(e),
          ).join(' ');
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
        birthDateRegister={register('birthDate', {
          validate: (value) => {
            if (!value) return true;
            if (!isValidDisplayDate(value)) return 'Usa el formato dd/mm/aaaa.';
            const iso = displayToIsoDate(value);
            if (iso > getTodayIso()) return 'La fecha de nacimiento no puede ser en el futuro.';
            return iso >= '1900-01-01' || 'La fecha de nacimiento no es válida.';
          },
        })}
        genderRegister={register('gender')}
        emailRegister={register('email', {
          required: 'El correo es obligatorio.',
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/,
            message: 'El correo no es válido.', },
        })}
        firstNameError={errors.firstName}
        lastNameError={errors.lastName}
        phoneError={errors.phone}
        birthDateError={errors.birthDate}
        genderError={errors.gender}
        emailError={errors.email}
        serverError={serverError}
        isSubmitting={isSubmitting}
      />

      <Toast message={toastMessage} type="success" onDismiss={() => setToastMessage(null)} />
    </>
  );
}
