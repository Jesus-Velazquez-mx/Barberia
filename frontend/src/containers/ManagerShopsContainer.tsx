import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus } from 'lucide-react';
import { Button } from '../components/common/ButtonComponent';
import { ConfirmDeleteModal } from '../components/common/ConfirmDeleteModalComponent';
import { FilterMenu } from '../components/common/FilterMenuComponent';
import { ManagerPageHeader } from '../components/dashboard/ManagerPageHeaderComponent';
import { SearchBar } from '../components/common/SearchBarComponent';
import { ShopFormModal } from '../components/shops/ShopFormModalComponent';
import { ShopTable } from '../components/shops/ShopTableComponent';
import { Toast } from '../components/common/ToastComponent';
import { useAuth } from '../context/AuthContext';
import type { Shop } from '../types/shop';
import type { ShopFormValues, ShopPayload, ShopRecord } from '../types/shopType';
import { ApiError } from '../types/api';
import { createShop, deleteShop, getShops, updateShop } from '../services/shopService';
import { getApiErrorMessage } from '../utils/apiErrorUtils';
import { matchesQuery, paginate } from '../utils/listUtils';
import {
  matchesStatus,
  SERVICE_FILTER_ALL,
  SERVICE_STATUS_FILTER_OPTIONS
} from '../utils/offeredServiceUtils';
import { formatPhone, joinFullName, normalizePhone } from '../utils/personUtils';
import { POSTAL_CODE_PATTERN, SHOP_NAME_MAX, SHOP_NUMBER_PATTERN, SHOP_STREET_MAX } from '../utils/shopUtils';

type FormState = { mode: 'create' } | { mode: 'edit'; shop: ShopRecord } | null;

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

const EMPTY_VALUES: ShopFormValues = {
  name: '',
  street: '',
  number: '',
  postalCode: '',
  phone: '',
  isActive: 'true'
};

const SESSION_EXPIRED_MESSAGE = 'Tu sesión expiró. Inicia sesión de nuevo.';

/* El backend responde en inglés: los casos esperados se traducen y el resto usa getApiErrorMessage. */
const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof ApiError) {
    if (error.status === 409) return 'Ya existe una sucursal con ese nombre.';
    if (error.status === 404) return 'No encontramos la sucursal.';
    if (error.status === 403) return 'No tienes permiso para administrar sucursales.';
    if (error.status === 0) return 'No se pudo conectar con el servidor. Intenta de nuevo.';
  }
  return getApiErrorMessage(error, fallback);
};

/* Texto vacío -> null, para guardar NULL en las columnas opcionales. */
const emptyToNull = (value: string): string | null => value.trim() || null;

export function ManagerShopsContainer() {
  const { token, user } = useAuth();

  /* GET /shops con token de manager solo devuelve sus sucursales y POST /shops las asigna al manager
     del token, así que el gerente de todas las filas es el usuario con sesión iniciada. */
  const managerName = user ? joinFullName(user) : '';
  const toRecord = useCallback((shop: Shop): ShopRecord => ({ ...shop, managerName }), [managerName]);

  const [shops, setShops] = useState<ShopRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(SERVICE_FILTER_ALL);
  const [page, setPage] = useState(1);

  const [formState, setFormState] = useState<FormState>(null);
  const [serverError, setServerError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<ShopRecord | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [toast, setToast] = useState<ToastState | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ShopFormValues>({ defaultValues: EMPTY_VALUES });

  const loadShops = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setLoadError('');

    try {
      setShops((await getShops(token, true)).map(toRecord));
    } catch (error) {
      setLoadError(getErrorMessage(error, 'No se pudieron cargar las sucursales. Intenta de nuevo.'));
    } finally {
      setIsLoading(false);
    }
  }, [token, toRecord]);

  useEffect(() => {
    void loadShops();
  }, [loadShops]);

  /* ---------- Lista: búsqueda, filtro de estado y paginación ---------- */

  const filteredShops = shops.filter(
    (shop) =>
      matchesStatus(shop.isActive, statusFilter) &&
      matchesQuery(
        [
          shop.name,
          shop.street,
          shop.postalCode,
          shop.phone,
          shop.phone ? formatPhone(shop.phone) : null,
          shop.managerName
        ],
        search
      )
  );
  const pageResult = paginate(filteredShops, page);
  const hasActiveCriteria = search !== '' || statusFilter !== SERVICE_FILTER_ALL;

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  /* ---------- Alta y edición ---------- */

  const openCreate = () => {
    reset(EMPTY_VALUES);
    setServerError('');
    setFormState({ mode: 'create' });
  };

  const openEdit = (shop: ShopRecord) => {
    reset({
      name: shop.name,
      street: shop.street ?? '',
      number: shop.number ?? '',
      postalCode: shop.postalCode ?? '',
      phone: shop.phone ? formatPhone(shop.phone) : '',
      isActive: shop.isActive ? 'true' : 'false'
    });
    setServerError('');
    setFormState({ mode: 'edit', shop });
  };

  const closeForm = () => {
    setFormState(null);
    setServerError('');
  };

  const onSubmit = async (values: ShopFormValues) => {
    if (!formState) return;
    setServerError('');

    if (!token) {
      setServerError(SESSION_EXPIRED_MESSAGE);
      return;
    }

    const isEdit = formState.mode === 'edit';

    const payload: ShopPayload = {
      name: values.name.trim(),
      street: emptyToNull(values.street),
      number: emptyToNull(values.number),
      postalCode: emptyToNull(values.postalCode),
      phone: values.phone.trim() ? normalizePhone(values.phone) : null,
      isActive: values.isActive === 'true'
    };

    try {
      const saved = toRecord(
        isEdit ? await updateShop(formState.shop.id, payload, token) : await createShop(payload, token)
      );

      setShops((current) =>
        isEdit ? current.map((shop) => (shop.id === saved.id ? saved : shop)) : [saved, ...current]
      );
      closeForm();
      setToast({
        message: isEdit ? 'Sucursal actualizada correctamente.' : 'Sucursal registrada correctamente.',
        type: 'success'
      });
    } catch (error) {
      setServerError(
        getErrorMessage(error, isEdit ? 'No se pudo actualizar la sucursal.' : 'No se pudo registrar la sucursal.')
      );
    }
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    void handleSubmit(onSubmit)(event);
  };

  /* ---------- Eliminación (borrado lógico) ---------- */

  const openDelete = (shop: ShopRecord) => {
    setDeleteError('');
    setDeleteTarget(shop);
  };

  const closeDelete = () => {
    if (isDeleting) return;
    setDeleteTarget(null);
    setDeleteError('');
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    if (!token) {
      setDeleteError(SESSION_EXPIRED_MESSAGE);
      return;
    }

    setIsDeleting(true);
    setDeleteError('');

    try {
      await deleteShop(deleteTarget, token);
      /* El backend no borra la fila: marca la sucursal como inactiva. */
      setShops((current) =>
        current.map((shop) => (shop.id === deleteTarget.id ? { ...shop, isActive: false } : shop))
      );
      setDeleteTarget(null);
      setToast({ message: 'Sucursal desactivada correctamente.', type: 'success' });
    } catch (error) {
      setDeleteError(getErrorMessage(error, 'No se pudo eliminar la sucursal.'));
    } finally {
      setIsDeleting(false);
    }
  };

  /* ---------- Reglas de validación (mismos límites que la tabla shops) ---------- */

  const nameRegister = register('name', {
    required: 'El nombre es obligatorio.',
    validate: (value) => value.trim().length > 0 || 'El nombre es obligatorio.',
    maxLength: { value: SHOP_NAME_MAX, message: `Máximo ${SHOP_NAME_MAX} caracteres.` }
  });

  const streetRegister = register('street', {
    maxLength: { value: SHOP_STREET_MAX, message: `Máximo ${SHOP_STREET_MAX} caracteres.` }
  });

  const numberRegister = register('number', {
    validate: (value) =>
      !value.trim() || SHOP_NUMBER_PATTERN.test(value.trim()) || 'Máximo 4 caracteres (ej. 123, 12A o S/N).'
  });

  const postalCodeRegister = register('postalCode', {
    validate: (value) => !value.trim() || POSTAL_CODE_PATTERN.test(value.trim()) || 'Debe tener 5 dígitos.'
  });

  // Opcional: si se escribe, debe tener 10 dígitos.
  const phoneRegister = register('phone', {
    validate: (value) =>
      !value.trim() ||
      (/^[\d\s-]+$/.test(value.trim()) && normalizePhone(value).length === 10) ||
      'Debe tener 10 dígitos.'
  });

  const isActiveRegister = register('isActive');

  return (
    <>
      <ManagerPageHeader title="Sucursales" subtitle="Directorio y administración de sucursales.">
        <FilterMenu
          label="Estado"
          title="Estado"
          options={SERVICE_STATUS_FILTER_OPTIONS}
          value={statusFilter}
          defaultValue={SERVICE_FILTER_ALL}
          onChange={handleStatusFilterChange}
        />
        <Button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 !text-sm !font-semibold !normal-case"
        >
          <Plus size={18} aria-hidden="true" />
          Nueva Sucursal
        </Button>
      </ManagerPageHeader>

      <div className="mt-6">
        <SearchBar
          value={search}
          onChange={handleSearchChange}
          placeholder="Buscar sucursal por nombre, dirección, teléfono o gerente..."
          ariaLabel="Buscar sucursal"
        />
      </div>

      <div className="mt-6">
        <ShopTable
          rows={pageResult.pageItems}
          startIndex={pageResult.from === 0 ? 0 : pageResult.from - 1}
          isLoading={isLoading}
          error={loadError}
          emptyMessage={
            hasActiveCriteria ? 'No se encontraron sucursales con esos criterios.' : 'Aún no hay sucursales registradas.'
          }
          onRetry={() => void loadShops()}
          onEdit={openEdit}
          onDelete={openDelete}
          canDelete={(row) => row.isActive}
          pagination={{
            from: pageResult.from,
            to: pageResult.to,
            total: pageResult.total,
            itemLabel: 'sucursales',
            currentPage: pageResult.currentPage,
            totalPages: pageResult.totalPages,
            onPageChange: setPage
          }}
        />
      </div>

      <ShopFormModal
        isOpen={formState !== null}
        onClose={closeForm}
        onSubmit={handleFormSubmit}
        mode={formState?.mode ?? 'create'}
        nameRegister={nameRegister}
        streetRegister={streetRegister}
        numberRegister={numberRegister}
        postalCodeRegister={postalCodeRegister}
        phoneRegister={phoneRegister}
        isActiveRegister={isActiveRegister}
        errors={errors}
        serverError={serverError}
        isSubmitting={isSubmitting}
      />

      <ConfirmDeleteModal
        isOpen={deleteTarget !== null}
        onClose={closeDelete}
        onConfirm={() => void confirmDelete()}
        title="¿Eliminar sucursal?"
        description={
          deleteTarget ? (
            <>
              La sucursal <strong className="text-[var(--text-h)]">{deleteTarget.name}</strong> quedará inactiva y
              dejará de estar disponible para agendar citas.
              <br />
              Se conserva el historial y puedes reactivarla después desde Editar.
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
