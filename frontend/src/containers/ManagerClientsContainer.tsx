import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus } from 'lucide-react';
import { Button } from '../components/ButtonComponent';
import { ClientFormModal } from '../components/ClientFormModalComponent';
import { ClientTable } from '../components/ClientTableComponent';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModalComponent';
import { ManagerPageHeader } from '../components/ManagerPageHeaderComponent';
import { SearchBar } from '../components/SearchBarComponent';
import { Toast } from '../components/ToastComponent';
import { useAuth } from '../context/AuthContext';
import { createClient, deleteClient, getClients, updateClient } from '../services/clientService';
import type { ClientFormValues, ClientPayload, ClientRecord } from '../types/clientType';
import { getApiErrorMessage } from '../utils/apiErrorUtils';
import { matchesQuery, paginate } from '../utils/listUtils';
import { formatPhone, joinFullName, normalizePhone, resolveNameParts, splitFullName } from '../utils/personUtils';

type FormState = { mode: 'create' } | { mode: 'edit'; client: ClientRecord } | null;

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

const EMPTY_VALUES: ClientFormValues = { fullName: '', phone: '', email: '' };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

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
      setLoadError(getApiErrorMessage(error, 'No se pudieron cargar los clientes. Intenta de nuevo.'));
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  /* ---------- Lista: búsqueda y paginación ---------- */

  const filteredClients = clients.filter((client) =>
    matchesQuery([joinFullName(client), client.email, client.phone, formatPhone(client.phone)], search)
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
      email: client.email
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
      phone: normalizePhone(values.phone)
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
        getApiErrorMessage(error, isEdit ? 'No se pudo actualizar el cliente.' : 'No se pudo registrar el cliente.')
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
      setDeleteError(getApiErrorMessage(error, 'No se pudo eliminar al cliente.'));
    } finally {
      setIsDeleting(false);
    }
  };

  /* ---------- Reglas de validación ---------- */

  const fullNameRegister = register('fullName', {
    required: 'El nombre es obligatorio.',
    validate: (value) => splitFullName(value) !== null || 'Ingresa nombre y apellido.'
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
          placeholder="Buscar cliente por nombre, teléfono o correo..."
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
          <>
            Esta acción no se puede deshacer.
            <br />
            Se eliminarán los datos de acceso, historial de servicios agendados y puntos acumulados.
          </>
        }
        confirmLabel="Sí, eliminar cuenta"
        serverError={deleteError}
        isSubmitting={isDeleting}
      />

      <Toast message={toast?.message ?? null} type={toast?.type} onDismiss={dismissToast} />
    </>
  );
}
