import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus } from 'lucide-react';
import { Button } from '../components/common/ButtonComponent';
import { ConfirmDeleteModal } from '../components/common/ConfirmDeleteModalComponent';
import { FilterMenu } from '../components/common/FilterMenuComponent';
import { ManagerPageHeader } from '../components/dashboard/ManagerPageHeaderComponent';
import { SearchBar } from '../components/common/SearchBarComponent';
import { StaffFormModal } from '../components/staff/StaffFormModalComponent';
import { StaffTable, type StaffRow } from '../components/staff/StaffTableComponent';
import { Toast } from '../components/common/ToastComponent';
import { useAuth } from '../context/AuthContext';
import { getShifts } from '../services/shiftService';
import { getShops } from '../services/shopService';
import { createStaff, deleteStaff, getStaffByShop, reactivateStaff, updateStaff } from '../services/staffService';
import { ApiError } from '../types/api';
import type { Shift } from '../types/shiftType';
import type { Shop } from '../types/shop';
import type { StaffFormValues, StaffMember, StaffPayload } from '../types/staffType';
import { getApiErrorMessage } from '../utils/apiErrorUtils';
import { displayToIsoDate, getTodayIso, isoToDisplayDate, isValidDisplayDate } from '../utils/dateFormat';
import { getGenderLabel } from '../utils/genderOptions';
import { matchesQuery, paginate } from '../utils/listUtils';
import { formatPhone, joinFullName, normalizePhone, resolveNameParts, splitFullName } from '../utils/personUtils';
import { formatShiftRange, getShiftLabel } from '../utils/shiftUtils';
import {
  STAFF_ROLE_FILTER_ALL,
  STAFF_ROLE_FILTER_OPTIONS,
  STAFF_STATUS_FILTER_ACTIVE,
  STAFF_STATUS_FILTER_OPTIONS
} from '../utils/staffOptions';

type FormState = { mode: 'create' } | { mode: 'edit'; member: StaffMember } | null;

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

const EMPTY_VALUES: StaffFormValues = {
  fullName: '',
  phone: '',
  email: '',
  birthDate: '',
  gender: '',
  role: 'barber',
  shopId: '',
  shiftId: '',
  password: ''
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

/* Traduce al español los mensajes de error esperados del backend de barberos y recepcionistas. */
const getStaffErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof ApiError) {
    const msg = error.message;
    if (error.status === 409) {
      if (/scheduled|rescheduled|checked-in|appointments/i.test(msg)) {
        return 'No se puede dar de baja al barbero porque tiene citas pendientes o en curso.';
      }
      if (/deleted|reactivation/i.test(msg)) {
        return 'Este integrante está dado de baja. Puedes reactivarlo desde Nuevo Personal escribiendo su correo.';
      }
      if (/phone/i.test(msg)) return 'Este teléfono ya está registrado.';
      if (/email/i.test(msg)) return 'Este correo electrónico ya está registrado.';
    }
    if (error.status === 404) {
      if (/shop/i.test(msg)) return 'La sucursal seleccionada no existe.';
      if (/shift/i.test(msg)) return 'El turno seleccionado no existe.';
      return 'No encontramos al integrante del personal.';
    }
    if (error.status === 403) return 'No tienes permiso para realizar esta acción.';
    if (error.status === 0) return 'No se pudo conectar con el servidor. Intenta de nuevo.';
  }
  return getApiErrorMessage(error, fallback);
};

export function ManagerStaffContainer() {
  const { token } = useAuth();

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState(STAFF_ROLE_FILTER_ALL);
  const [statusFilter, setStatusFilter] = useState(STAFF_STATUS_FILTER_ACTIVE);
  const [page, setPage] = useState(1);

  const [formState, setFormState] = useState<FormState>(null);
  const [serverError, setServerError] = useState('');
  const [isReactivating, setIsReactivating] = useState(false);

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
  const watchedEmail = watch('email');

  /* Detecta en tiempo real si el correo escrito pertenece a un integrante dado de baja. */
  const inactiveEmailMatch = useMemo(() => {
    if (formState?.mode !== 'create') return null;
    const normalized = watchedEmail.trim().toLowerCase();
    if (!normalized) return null;
    return staff.find((member) => !member.isActive && member.email?.toLowerCase() === normalized) ?? null;
  }, [formState, watchedEmail, staff]);

  const loadData = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setLoadError('');

    try {
      const [loadedShops, loadedShifts] = await Promise.all([getShops(token, true), getShifts(token)]);
      const staffByShop = await Promise.all(
        loadedShops.map((shop) => getStaffByShop(shop.id, token, true))
      );

      setShops(loadedShops);
      setShifts(loadedShifts);
      setStaff(staffByShop.flat());
    } catch (error) {
      setLoadError(getStaffErrorMessage(error, 'No se pudo cargar el personal. Intenta de nuevo.'));
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  /* ---------- Opciones de sucursales y turnos para el formulario ---------- */

  const editingShopId = formState?.mode === 'edit' ? formState.member.shopId : null;
  const shopOptions = useMemo(
    () =>
      shops
        .filter((shop) => shop.isActive || shop.id === editingShopId)
        .map((shop) => ({
          value: shop.id,
          label: shop.isActive ? shop.name : `${shop.name} (inactiva)`
        })),
    [shops, editingShopId]
  );

  const shiftOptions = useMemo(
    () =>
      shifts.map((shift) => ({
        value: shift.id,
        label: `${getShiftLabel(shift.name)} (${formatShiftRange(shift.startTime, shift.endTime)})`
      })),
    [shifts]
  );

  /* ---------- Lista: filtro por rol, filtro por estado, búsqueda y paginación ---------- */

  const rows: StaffRow[] = useMemo(
    () =>
      staff.map((member) => {
        const shop = shops.find((item) => item.id === member.shopId);
        const shift = shifts.find((item) => item.id === member.shiftId);
        return {
          ...member,
          shopName: shop?.name ?? '—',
          shiftLabel: shift ? `${getShiftLabel(shift.name)} (${formatShiftRange(shift.startTime, shift.endTime)})` : '—'
        };
      }),
    [staff, shops, shifts]
  );

  const filteredStaff = rows.filter(
    (member) =>
      (roleFilter === STAFF_ROLE_FILTER_ALL || member.role === roleFilter) &&
      (statusFilter === STAFF_STATUS_FILTER_ACTIVE ? member.isActive : !member.isActive) &&
      matchesQuery(
        [
          joinFullName(member),
          member.email,
          member.phone,
          formatPhone(member.phone),
          getGenderLabel(member.gender),
          member.shopName,
          member.shiftLabel
        ],
        search
      )
  );
  const pageResult = paginate(filteredStaff, page);
  const hasActiveCriteria =
    search !== '' || roleFilter !== STAFF_ROLE_FILTER_ALL || statusFilter !== STAFF_STATUS_FILTER_ACTIVE;

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    setPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  /* ---------- Alta, reactivación y edición ---------- */

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
      birthDate: isoToDisplayDate(member.birthDate),
      gender: member.gender,
      role: member.role,
      shopId: member.shopId,
      shiftId: member.shiftId,
      password: ''
    });
    setServerError('');
    setFormState({ mode: 'edit', member });
  };

  const closeForm = () => {
    if (isReactivating) return;
    setFormState(null);
    setServerError('');
  };

  const handleReactivate = async () => {
    if (!inactiveEmailMatch) return;
    setServerError('');

    if (!token) {
      setServerError('Tu sesión expiró. Inicia sesión de nuevo.');
      return;
    }

    setIsReactivating(true);
    try {
      const reactivated = await reactivateStaff(inactiveEmailMatch, token);
      setStaff((current) =>
        current.map((member) => (member.id === reactivated.id ? reactivated : member))
      );
      setFormState(null);
      setServerError('');
      setToast({
        message: `${joinFullName(reactivated)} fue reactivado correctamente.`,
        type: 'success'
      });
    } catch (error) {
      setServerError(getStaffErrorMessage(error, 'No se pudo reactivar al personal.'));
    } finally {
      setIsReactivating(false);
    }
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
      email: values.email.trim(),
      phone: normalizePhone(values.phone),
      birthDate: displayToIsoDate(values.birthDate),
      gender: values.gender,
      role: memberRole,
      shopId: values.shopId,
      shiftId: values.shiftId,
      ...(!isEdit && memberRole === 'receptionist' && { password: values.password })
    };

    try {
      const saved = isEdit ? await updateStaff(formState.member.id, payload, token) : await createStaff(payload, token);

      setStaff((current) =>
        isEdit || current.some((member) => member.id === saved.id)
          ? current.map((member) => (member.id === saved.id ? saved : member))
          : [saved, ...current]
      );
      closeForm();
      setToast({
        message: isEdit ? 'Personal actualizado correctamente.' : 'Personal registrado correctamente.',
        type: 'success'
      });
    } catch (error) {
      setServerError(
        getStaffErrorMessage(
          error,
          isEdit ? 'No se pudo actualizar el personal.' : 'No se pudo registrar el personal.'
        )
      );
    }
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    void handleSubmit(onSubmit)(event);
  };

  /* ---------- Baja (borrado lógico) ---------- */

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
      /* El backend realiza borrado lógico (deleted_at); se marca como inactivo en la tabla. */
      setStaff((current) =>
        current.map((member) => (member.id === deleteTarget.id ? { ...member, isActive: false } : member))
      );
      setDeleteTarget(null);
      setToast({ message: 'Personal dado de baja correctamente.', type: 'success' });
    } catch (error) {
      setDeleteError(getStaffErrorMessage(error, 'No se pudo eliminar al personal.'));
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
  const roleRegister = register('role', { required: 'Selecciona un rol.' });
  const shopRegister = register('shopId', { required: 'Selecciona una sucursal.' });
  const shiftRegister = register('shiftId', { required: 'Selecciona un turno.' });

  // La contraseña solo se pide al dar de alta a un recepcionista; para barberos y en modo edición se ignora.
  const passwordRegister = register('password', {
    validate: (value, formValues) => {
      if (formState?.mode !== 'create' || formValues.role !== 'receptionist') return true;
      if (!value) return 'La contraseña es obligatoria.';
      return value.length >= 6 || 'Debe tener al menos 6 caracteres.';
    }
  });

  return (
    <>
      <ManagerPageHeader title="Personal" subtitle="Directorio y administración del personal.">
        <FilterMenu
          label="Rol"
          title="Rol"
          options={STAFF_ROLE_FILTER_OPTIONS}
          value={roleFilter}
          defaultValue={STAFF_ROLE_FILTER_ALL}
          onChange={handleRoleFilterChange}
        />
        <FilterMenu
          label="Estado"
          title="Estado"
          options={STAFF_STATUS_FILTER_OPTIONS}
          value={statusFilter}
          defaultValue={STAFF_STATUS_FILTER_ACTIVE}
          onChange={handleStatusFilterChange}
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
          placeholder="Buscar personal por nombre, teléfono, correo, sucursal o turno..."
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
            hasActiveCriteria
              ? 'No se encontró personal con esos criterios.'
              : 'Aún no hay personal registrado.'
          }
          onRetry={() => void loadData()}
          onEdit={openEdit}
          onDelete={openDelete}
          canDelete={(member) => member.isActive}
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
        shopOptions={shopOptions}
        shiftOptions={shiftOptions}
        fullNameRegister={fullNameRegister}
        phoneRegister={phoneRegister}
        emailRegister={emailRegister}
        birthDateRegister={birthDateRegister}
        genderRegister={genderRegister}
        roleRegister={roleRegister}
        shopRegister={shopRegister}
        shiftRegister={shiftRegister}
        passwordRegister={passwordRegister}
        inactiveEmailMatch={inactiveEmailMatch}
        onReactivate={() => void handleReactivate()}
        isReactivating={isReactivating}
        errors={errors}
        serverError={serverError}
        isSubmitting={isSubmitting}
      />

      <ConfirmDeleteModal
        isOpen={deleteTarget !== null}
        onClose={closeDelete}
        onConfirm={() => void confirmDelete()}
        title="¿Dar de baja al personal?"
        description={
          deleteTarget ? (
            <>
              Esta acción dará de baja a <strong className="text-[var(--text-h)]">{joinFullName(deleteTarget)}</strong>{' '}
              y su estado pasará a inactivo.
              <br />
              Podrás reactivarlo después desde Nuevo Personal escribiendo su correo electrónico.
            </>
          ) : null
        }
        confirmLabel="Sí, dar de baja"
        serverError={deleteError}
        isSubmitting={isDeleting}
      />

      <Toast message={toast?.message ?? null} type={toast?.type} onDismiss={dismissToast} />
    </>
  );
}
