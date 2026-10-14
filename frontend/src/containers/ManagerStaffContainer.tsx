import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus } from 'lucide-react';
import { Button } from '../components/ButtonComponent';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModalComponent';
import { FilterMenu } from '../components/FilterMenuComponent';
import { ManagerPageHeader } from '../components/ManagerPageHeaderComponent';
import { SearchBar } from '../components/SearchBarComponent';
import { StaffFormModal } from '../components/StaffFormModalComponent';
import { StaffTable } from '../components/StaffTableComponent';
import { Toast } from '../components/ToastComponent';
import { useAuth } from '../context/AuthContext';
import { MOCK_SHIFT_OPTIONS, MOCK_SHOP_OPTIONS } from '../mocks/adminMock';
import { createStaff, deleteStaff, getStaff, updateStaff } from '../services/staffService';
import type { StaffFormValues, StaffMember, StaffPayload } from '../types/staffType';
import { getApiErrorMessage } from '../utils/apiErrorUtils';
import { matchesQuery, paginate } from '../utils/listUtils';
import { formatPhone, joinFullName, normalizePhone, resolveNameParts, splitFullName } from '../utils/personUtils';
import { STAFF_ROLE_FILTER_ALL, STAFF_ROLE_FILTER_OPTIONS } from '../utils/staffOptions';

type FormState = { mode: 'create' } | { mode: 'edit'; member: StaffMember } | null;

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

const EMPTY_VALUES: StaffFormValues = {
  fullName: '',
  phone: '',
  email: '',
  role: 'barber',
  shopId: '',
  shiftId: '',
  password: ''
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

export function ManagerStaffContainer() {
  const { token } = useAuth();

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState(STAFF_ROLE_FILTER_ALL);
  const [page, setPage] = useState(1);

  const [formState, setFormState] = useState<FormState>(null);
  const [serverError, setServerError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [toast, setToast] = useState<ToastState | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<StaffFormValues>({ defaultValues: EMPTY_VALUES });
  const role = watch('role');

  const loadStaff = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setLoadError('');

    try {
      setStaff(await getStaff(token));
    } catch (error) {
      setLoadError(getApiErrorMessage(error, 'No se pudo cargar el personal. Intenta de nuevo.'));
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadStaff();
  }, [loadStaff]);

  /* ---------- Lista: filtro por rol, búsqueda y paginación ---------- */

  const filteredStaff = staff.filter(
    (member) =>
      (roleFilter === STAFF_ROLE_FILTER_ALL || member.role === roleFilter) &&
      matchesQuery([joinFullName(member), member.email, member.phone, formatPhone(member.phone)], search)
  );
  const pageResult = paginate(filteredStaff, page);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    setPage(1);
  };

  /* ---------- Alta y edición ---------- */

  const openCreate = () => {
    reset(EMPTY_VALUES);
    setServerError('');
    setFormState({ mode: 'create' });
  };

  const openEdit = (member: StaffMember) => {
    reset({
      fullName: joinFullName(member),
      phone: formatPhone(member.phone),
      email: member.email ?? '',
      role: member.role,
      shopId: member.shopId,
      shiftId: member.shiftId,
      password: ''
    });
    setServerError('');
    setFormState({ mode: 'edit', member });
  };

  const closeForm = () => {
    setFormState(null);
    setServerError('');
  };

  const onSubmit = async (values: StaffFormValues) => {
    if (!formState) return;
    setServerError('');

    if (!token) {
      setServerError('Tu sesión expiró. Inicia sesión de nuevo.');
      return;
    }

    const isEdit = formState.mode === 'edit';
    const name = resolveNameParts(values.fullName, isEdit ? formState.member : undefined);
    if (!name) {
      setServerError('Ingresa nombre y apellido.');
      return;
    }

    // Al editar, el rol no cambia (un barbero no puede volverse recepcionista y viceversa).
    const memberRole = isEdit ? formState.member.role : values.role;

    const payload: StaffPayload = {
      ...name,
      email: values.email.trim() || null,
      phone: normalizePhone(values.phone),
      role: memberRole,
      shopId: values.shopId,
      shiftId: values.shiftId,
      ...(!isEdit && memberRole === 'receptionist' && { password: values.password })
    };

    try {
      const saved = isEdit ? await updateStaff(formState.member.id, payload, token) : await createStaff(payload, token);

      setStaff((current) =>
        isEdit ? current.map((member) => (member.id === saved.id ? saved : member)) : [saved, ...current]
      );
      closeForm();
      setToast({
        message: isEdit ? 'Personal actualizado correctamente.' : 'Personal registrado correctamente.',
        type: 'success'
      });
    } catch (error) {
      setServerError(
        getApiErrorMessage(error, isEdit ? 'No se pudo actualizar el personal.' : 'No se pudo registrar el personal.')
      );
    }
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    void handleSubmit(onSubmit)(event);
  };

  /* ---------- Baja ---------- */

  const openDelete = (member: StaffMember) => {
    setDeleteError('');
    setDeleteTarget(member);
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
      await deleteStaff(deleteTarget, token);
      setStaff((current) => current.filter((member) => member.id !== deleteTarget.id));
      setDeleteTarget(null);
      setToast({ message: 'Personal eliminado correctamente.', type: 'success' });
    } catch (error) {
      setDeleteError(getApiErrorMessage(error, 'No se pudo eliminar al personal.'));
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

  // El correo solo es obligatorio para recepcionistas: los barberos no tienen cuenta.
  const emailRegister = register('email', {
    validate: (value, formValues) => {
      const email = value.trim();
      if (!email) return formValues.role === 'receptionist' ? 'El correo es obligatorio.' : true;
      return EMAIL_PATTERN.test(email) || 'El correo no es válido.';
    }
  });

  const roleRegister = register('role', { required: 'Selecciona un rol.' });
  const shopRegister = register('shopId', { required: 'Selecciona una sucursal.' });
  const shiftRegister = register('shiftId', { required: 'Selecciona un turno.' });

  // El campo solo se muestra (y por tanto solo se valida) al dar de alta a un recepcionista.
  const passwordRegister = register('password', {
    required: 'La contraseña es obligatoria.',
    minLength: { value: 6, message: 'Debe tener al menos 6 caracteres.' }
  });

  return (
    <>
      <ManagerPageHeader title="Personal" subtitle="Directorio y administración del personal.">
        <FilterMenu
          title="Rol"
          options={STAFF_ROLE_FILTER_OPTIONS}
          value={roleFilter}
          defaultValue={STAFF_ROLE_FILTER_ALL}
          onChange={handleRoleFilterChange}
        />
        <Button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 !text-sm !font-semibold !normal-case"
        >
          <Plus size={18} aria-hidden="true" />
          Nuevo Personal
        </Button>
      </ManagerPageHeader>

      <div className="mt-6">
        <SearchBar
          value={search}
          onChange={handleSearchChange}
          placeholder="Buscar personal por nombre, teléfono o correo..."
          ariaLabel="Buscar personal"
        />
      </div>

      <div className="mt-6">
        <StaffTable
          rows={pageResult.pageItems}
          startIndex={pageResult.from === 0 ? 0 : pageResult.from - 1}
          isLoading={isLoading}
          error={loadError}
          emptyMessage={
            search || roleFilter !== STAFF_ROLE_FILTER_ALL
              ? 'No se encontró personal con esos criterios.'
              : 'Aún no hay personal registrado.'
          }
          onRetry={() => void loadStaff()}
          onEdit={openEdit}
          onDelete={openDelete}
          pagination={{
            from: pageResult.from,
            to: pageResult.to,
            total: pageResult.total,
            itemLabel: 'integrantes',
            currentPage: pageResult.currentPage,
            totalPages: pageResult.totalPages,
            onPageChange: setPage
          }}
        />
      </div>

      <StaffFormModal
        isOpen={formState !== null}
        onClose={closeForm}
        onSubmit={handleFormSubmit}
        mode={formState?.mode ?? 'create'}
        role={role}
        shopOptions={MOCK_SHOP_OPTIONS}
        shiftOptions={MOCK_SHIFT_OPTIONS}
        fullNameRegister={fullNameRegister}
        phoneRegister={phoneRegister}
        emailRegister={emailRegister}
        roleRegister={roleRegister}
        shopRegister={shopRegister}
        shiftRegister={shiftRegister}
        passwordRegister={passwordRegister}
        errors={errors}
        serverError={serverError}
        isSubmitting={isSubmitting}
      />

      <ConfirmDeleteModal
        isOpen={deleteTarget !== null}
        onClose={closeDelete}
        onConfirm={() => void confirmDelete()}
        title="¿Eliminar personal del sistema?"
        description={
          deleteTarget ? (
            <>
              Esta acción dará de baja a <strong className="text-[var(--text-h)]">{joinFullName(deleteTarget)}</strong>.
              <br />
              Dejará de aparecer en el directorio del personal.
            </>
          ) : null
        }
        confirmLabel="Sí, eliminar"
        serverError={deleteError}
        isSubmitting={isDeleting}
      />

      <Toast message={toast?.message ?? null} type={toast?.type} onDismiss={dismissToast} />
    </>
  );
}
