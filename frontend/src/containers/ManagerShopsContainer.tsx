import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus } from 'lucide-react';
import { Button } from '../components/ButtonComponent';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModalComponent';
import { ManagerPageHeader } from '../components/ManagerPageHeaderComponent';
import { SearchBar } from '../components/SearchBarComponent';
import { ShopFormModal } from '../components/ShopFormModalComponent';
import { ShopTable } from '../components/ShopTableComponent';
import { Toast } from '../components/ToastComponent';
import { MOCK_MANAGERS } from '../mocks/shopMocks';
import type { ShopFormValues, ShopPayload, ShopRecord } from '../types/shopType';
import { createShop, deleteShop, getShops, updateShop } from '../services/shopMockService';
import { matchesQuery, paginate } from '../utils/listUtils';
import { formatPhone, normalizePhone } from '../utils/personUtils';
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
  managerId: ''
};

/* El servicio con mock lanza Error con el mensaje listo. Con la API real, cambia esto por
   getErrorMessage(error, fallback), como en ManagerStaffContainer. */
const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback;

/* Texto vacío -> null, para guardar NULL en las columnas opcionales. */
const emptyToNull = (value: string): string | null => value.trim() || null;

export function ManagerShopsContainer() {
  const [shops, setShops] = useState<ShopRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [search, setSearch] = useState('');
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
    setIsLoading(true);
    setLoadError('');

    try {
      setShops(await getShops());
    } catch (error) {
      setLoadError(getErrorMessage(error, 'No se pudieron cargar las sucursales. Intenta de nuevo.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadShops();
  }, [loadShops]);

  /* ---------- Lista: búsqueda y paginación ---------- */

  const filteredShops = shops.filter((shop) =>
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

  const openEdit = (shop: ShopRecord) => {
    reset({
      name: shop.name,
      street: shop.street ?? '',
      number: shop.number ?? '',
      postalCode: shop.postalCode ?? '',
      phone: shop.phone ? formatPhone(shop.phone) : '',
      managerId: shop.managerId
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

    const isEdit = formState.mode === 'edit';

    const payload: ShopPayload = {
      name: values.name.trim(),
      street: emptyToNull(values.street),
      number: emptyToNull(values.number),
      postalCode: emptyToNull(values.postalCode),
      phone: values.phone.trim() ? normalizePhone(values.phone) : null,
      managerId: values.managerId
    };

    try {
      const saved = isEdit ? await updateShop(formState.shop.id, payload) : await createShop(payload);

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

  /* ---------- Baja ---------- */

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

    setIsDeleting(true);
    setDeleteError('');

    try {
      await deleteShop(deleteTarget);
      setShops((current) => current.filter((shop) => shop.id !== deleteTarget.id));
      setDeleteTarget(null);
      setToast({ message: 'Sucursal eliminada correctamente.', type: 'success' });
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

  const managerRegister = register('managerId', { required: 'Selecciona un gerente.' });

  return (
    <>
      <ManagerPageHeader title="Sucursales" subtitle="Directorio y administración de sucursales.">
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
          emptyMessage={search ? 'No se encontraron sucursales con esos criterios.' : 'Aún no hay sucursales registradas.'}
          onRetry={() => void loadShops()}
          onEdit={openEdit}
          onDelete={openDelete}
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
        managerOptions={MOCK_MANAGERS}
        nameRegister={nameRegister}
        streetRegister={streetRegister}
        numberRegister={numberRegister}
        postalCodeRegister={postalCodeRegister}
        phoneRegister={phoneRegister}
        managerRegister={managerRegister}
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
              Esta acción dará de baja la sucursal{' '}
              <span className="text-[var(--text-h)]">{deleteTarget.name}</span>.
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