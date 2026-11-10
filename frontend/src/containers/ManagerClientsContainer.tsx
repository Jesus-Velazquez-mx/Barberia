import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus } from 'lucide-react';
import { Button } from '../components/common/ButtonComponent';
import { ClientFormModal } from '../components/clients/ClientFormModalComponent';
import { ClientTable } from '../components/clients/ClientTableComponent';
import { ConfirmDeleteModal } from '../components/common/ConfirmDeleteModalComponent';
import { ManagerPageHeader } from '../components/dashboard/ManagerPageHeaderComponent';
import { SearchBar } from '../components/common/SearchBarComponent';
import { Toast } from '../components/common/ToastComponent';
import { useAuth } from '../context/AuthContext';
import { createClient, deleteClient, getClients, updateClient } from '../services/clientService';
import { ApiError } from '../types/api';
import type { ClientFormValues, ClientPayload, ClientRecord } from '../types/clientType';
import { getApiErrorMessage } from '../utils/apiErrorUtils';
import { displayToIsoDate, getTodayIso, isoToDisplayDate, isValidDisplayDate } from '../utils/dateFormat';
import { getGenderLabel } from '../utils/genderOptions';
import { matchesQuery, paginate } from '../utils/listUtils';
import { formatPhone, joinFullName, normalizePhone, resolveNameParts, splitFullName } from '../utils/personUtils';

type FormState = { mode: 'create' } | { mode: 'edit'; client: ClientRecord } | null;

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

const EMPTY_VALUES: ClientFormValues = {
  fullName: '',
  phone: '',
  email: '',
  birthDate: '',
  gender: '',
  password: ''
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

/* Traduce al español los mensajes de error esperados del backend de clientes. */
const getClientErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof ApiError) {
    const msg = error.message;
    if (error.status === 409) {
      if (/phone/i.test(msg)) return 'Este teléfono ya está registrado.';
      if (/email/i.test(msg)) return 'Este correo electrónico ya está registrado.';
    }
    if (error.status === 404) return 'No encontramos al cliente.';
    if (error.status === 403) return 'No tienes permiso para realizar esta acción.';
    if (error.status === 0) return 'No se pudo conectar con el servidor. Intenta de nuevo.';
  }
  return getApiErrorMessage(error, fallback);
};

export function ManagerClientsContainer() {
  const { token } = useAuth();

  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [formState, setFormState] = useState<FormState>(null);
  const [serverError, setServerError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<ClientRecord | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [toast, setToast] = useState<ToastState | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ClientFormValues>({ defaultValues: EMPTY_VALUES });

  const loadClients = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setLoadError('');

    try {
      setClients(await getClients(token));
    } catch (error) {
      setLoadError(getClientErrorMessage(error, 'No se pudieron cargar los clientes. Intenta de nuevo.'));
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  /* ---------- Lista: búsqueda y paginación ---------- */

  const filteredClients = clients.filter((client) =>
    matchesQuery(
      [
        joinFullName(client),
        client.email,
        client.phone,
        formatPhone(client.phone),
        getGenderLabel(client.gender)
      ],
      search
    )
  );
  const pageResult = paginate(filteredClients, page);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  /* ---------- Alta y edición ---------- */

  const openCreate = () => {
    reset(EMPTY_VALUES);
    setServerError('');
    setFormState({ mode: 'create' });
  };

  const openEdit = (client: ClientRecord) => {
    reset({
      fullName: joinFullName(client),
      phone: formatPhone(client.phone),
      email: client.email,
      birthDate: isoToDisplayDate(client.birthDate),
      gender: client.gender,
      password: ''
    });
    setServerError('');
    setFormState({ mode: 'edit', client });
  };

  const closeForm = () => {
    setFormState(null);
    setServerError('');
  };

  const onSubmit = async (values: ClientFormValues) => {
    if (!formState) return;
    setServerError('');

    if (!token) {
      setServerError('Tu sesión expiró. Inicia sesión de nuevo.');
      return;
    }

    const isEdit = formState.mode === 'edit';
    const name = resolveNameParts(values.fullName, isEdit ? formState.client : undefined);
    if (!name) {
      setServerError('Ingresa nombre y apellido.');
      return;
    }

    const payload: ClientPayload = {
      ...name,
      email: values.email.trim(),
      phone: normalizePhone(values.phone),
      birthDate: displayToIsoDate(values.birthDate),
      gender: values.gender,
      ...(!isEdit && { password: values.password })
    };

    try {
      const saved = isEdit
        ? await updateClient(formState.client.id, payload, token)
        : await createClient(payload, token);

      setClients((current) =>
        isEdit ? current.map((client) => (client.id === saved.id ? saved : client)) : [saved, ...current]
      );
      closeForm();
      setToast({
        message: isEdit ? 'Cliente actualizado correctamente.' : 'Cliente registrado correctamente.',
        type: 'success'
      });
    } catch (error) {
      setServerError(
        getClientErrorMessage(error, isEdit ? 'No se pudo actualizar el cliente.' : 'No se pudo registrar el cliente.')
      );
    }
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    void handleSubmit(onSubmit)(event);
  };

  /* ---------- Baja ---------- */

  const openDelete = (client: ClientRecord) => {
    setDeleteError('');
    setDeleteTarget(client);
  };

  const closeDelete = () => {
    if (isDeleting) return;
    setDeleteTarget(null);
    setDeleteError('');
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    if (!token) {
      setDeleteError('Tu sesión expiró. Inicia sesión de nuevo.');
      return;
    }

    setIsDeleting(true);
    setDeleteError('');

    try {
      await deleteClient(deleteTarget.id, token);
      setClients((current) => current.filter((client) => client.id !== deleteTarget.id));
      setDeleteTarget(null);
      setToast({ message: 'Cliente eliminado correctamente.', type: 'success' });
    } catch (error) {
      setDeleteError(getClientErrorMessage(error, 'No se pudo eliminar al cliente.'));
    } finally {
      setIsDeleting(false);
    }
  };

  /* ---------- Reglas de validación ---------- */

  const fullNameRegister = register('fullName', {
    required: 'El nombre es obligatorio.',
    validate: (value) => {
      const parts = splitFullName(value);
      if (!parts) return 'Ingresa nombre y apellido.';
      if (parts.firstName.length < 2 || parts.lastName.length < 2) {
        return 'Nombre y apellido deben tener al menos 2 caracteres.';
      }
      return true;
    }
  });

  const phoneRegister = register('phone', {
    required: 'El teléfono es obligatorio.',
    validate: (value) =>
      (/^[\d\s-]+$/.test(value.trim()) && normalizePhone(value).length === 10) || 'Debe tener 10 dígitos.'
  });

  const emailRegister = register('email', {
    required: 'El correo es obligatorio.',
    validate: (value) => EMAIL_PATTERN.test(value.trim()) || 'El correo no es válido.'
  });

  const birthDateRegister = register('birthDate', {
    required: 'La fecha de nacimiento es obligatoria.',
    validate: (value) => {
      if (!isValidDisplayDate(value)) return 'Usa el formato dd/mm/aaaa.';
      const iso = displayToIsoDate(value);
      if (iso > getTodayIso()) return 'La fecha de nacimiento no puede ser en el futuro.';
      return iso >= '1900-01-01' || 'La fecha de nacimiento no es válida.';
    }
  });

  const genderRegister = register('gender', { required: 'Selecciona un género.' });

  // La contraseña solo se pide al dar de alta al cliente; en modo edición se ignora.
  const passwordRegister = register('password', {
    validate: (value) => {
      if (formState?.mode !== 'create') return true;
      if (!value) return 'La contraseña es obligatoria.';
      return value.length >= 6 || 'Debe tener al menos 6 caracteres.';
    }
  });

  return (
    <>
      <ManagerPageHeader title="Clientes" subtitle="Directorio y administración de clientes registrados.">
        <Button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 text-sm! font-semibold! normal-case!"
        >
          <Plus size={18} aria-hidden="true" />
          Nuevo Cliente
        </Button>
      </ManagerPageHeader>

      <div className="mt-6">
        <SearchBar
          value={search}
          onChange={handleSearchChange}
          placeholder="Buscar cliente por nombre, teléfono, correo o género..."
          ariaLabel="Buscar cliente"
        />
      </div>

      <div className="mt-6">
        <ClientTable
          rows={pageResult.pageItems}
          startIndex={pageResult.from === 0 ? 0 : pageResult.from - 1}
          isLoading={isLoading}
          error={loadError}
          emptyMessage={search ? 'No se encontraron clientes con esa búsqueda.' : 'Aún no hay clientes registrados.'}
          onRetry={() => void loadClients()}
          onEdit={openEdit}
          onDelete={openDelete}
          pagination={{
            from: pageResult.from,
            to: pageResult.to,
            total: pageResult.total,
            itemLabel: 'clientes',
            currentPage: pageResult.currentPage,
            totalPages: pageResult.totalPages,
            onPageChange: setPage
          }}
        />
      </div>

      <ClientFormModal
        isOpen={formState !== null}
        onClose={closeForm}
        onSubmit={handleFormSubmit}
        mode={formState?.mode ?? 'create'}
        fullNameRegister={fullNameRegister}
        phoneRegister={phoneRegister}
        emailRegister={emailRegister}
        birthDateRegister={birthDateRegister}
        genderRegister={genderRegister}
        passwordRegister={passwordRegister}
        errors={errors}
        serverError={serverError}
        isSubmitting={isSubmitting}
      />

      <ConfirmDeleteModal
        isOpen={deleteTarget !== null}
        onClose={closeDelete}
        onConfirm={() => void confirmDelete()}
        title="¿Eliminar cliente permanentemente?"
        description={
          deleteTarget ? (
            <>
              Esta acción eliminará permanentemente a{' '}
              <strong className="text-[var(--text-h)]">{joinFullName(deleteTarget)}</strong> y no se puede deshacer.
              <br />
              Se eliminarán sus datos de acceso y puntos acumulados.
            </>
          ) : null
        }
        confirmLabel="Sí, eliminar cuenta"
        serverError={deleteError}
        isSubmitting={isDeleting}
      />

      <Toast message={toast?.message ?? null} type={toast?.type} onDismiss={dismissToast} />
    </>
  );
}
