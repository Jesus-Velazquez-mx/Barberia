import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus } from 'lucide-react';
import { Button } from '../components/common/ButtonComponent';
import { ConfirmDeleteModal } from '../components/common/ConfirmDeleteModalComponent';
import { FilterMenu } from '../components/common/FilterMenuComponent';
import { ManagerPageHeader } from '../components/dashboard/ManagerPageHeaderComponent';
import { SearchBar } from '../components/common/SearchBarComponent';
import { SupplyFormModal } from '../components/supplies/SupplyFormModalComponent';
import { SupplyTable, type SupplyRow } from '../components/supplies/SupplyTableComponent';
import { Toast } from '../components/common/ToastComponent';
import { useAuth } from '../context/AuthContext';
import { getSupplyCategories } from '../services/supplyCategoryService';
import { createSupply, deleteSupply, getSupplies, getSupplyShops, updateSupply } from '../services/supplyService';
import type { Supply, SupplyFormValues, SupplyPayload, SupplyShop } from '../types/supplyType';
import type { SupplyCategory } from '../types/supplyCategoryType';
import { matchesQuery, paginate } from '../utils/listUtils';
import { getSupplyErrorMessage, SUPPLY_FILTER_ALL } from '../utils/supplyUtils';

type FormState = { mode: 'create' } | { mode: 'edit'; supply: Supply } | null;

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

const EMPTY_VALUES: SupplyFormValues = {
  name: '',
  shopId: '',
  categoryId: '',
  unit: '',
  sku: '',
  description: ''
};

export function StaffSuppliesContainer() {
  const { token } = useAuth();

  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [shops, setShops] = useState<SupplyShop[]>([]);
  const [categories, setCategories] = useState<SupplyCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [search, setSearch] = useState('');
  const [shopFilter, setShopFilter] = useState(SUPPLY_FILTER_ALL);
  const [categoryFilter, setCategoryFilter] = useState(SUPPLY_FILTER_ALL);
  const [page, setPage] = useState(1);

  const [formState, setFormState] = useState<FormState>(null);
  const [serverError, setServerError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<Supply | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [toast, setToast] = useState<ToastState | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<SupplyFormValues>({ defaultValues: EMPTY_VALUES });

  const loadData = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setLoadError('');

    try {
      const [loadedSupplies, loadedShops, loadedCategories] = await Promise.all([
        getSupplies(token),
        getSupplyShops(),
        getSupplyCategories(token)
      ]);
      setSupplies(loadedSupplies);
      setShops(loadedShops);
      setCategories(loadedCategories);
    } catch (error) {
      setLoadError(getSupplyErrorMessage(error, 'No se pudieron cargar los suministros. Intenta de nuevo.'));
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  /* ---------- Catálogos para filtros y formulario ---------- */

  const shopOptions = useMemo(() => shops.map((shop) => ({ value: shop.id, label: shop.name })), [shops]);
  const categoryOptions = useMemo(
    () => categories.map((category) => ({ value: category.id, label: category.name })),
    [categories]
  );

  const shopFilterOptions = [{ value: SUPPLY_FILTER_ALL, label: 'Todas' }, ...shopOptions];
  const categoryFilterOptions = [{ value: SUPPLY_FILTER_ALL, label: 'Todas' }, ...categoryOptions];

  /* ---------- Lista: filtros, búsqueda y paginación ---------- */

  const rows: SupplyRow[] = supplies.map((supply) => ({
    ...supply,
    categoryName: categories.find((category) => category.id === supply.categoryId)?.name ?? '—',
    shopName: shops.find((shop) => shop.id === supply.shopId)?.name ?? '—'
  }));

  const filteredRows = rows.filter(
    (row) =>
      (shopFilter === SUPPLY_FILTER_ALL || row.shopId === shopFilter) &&
      (categoryFilter === SUPPLY_FILTER_ALL || row.categoryId === categoryFilter) &&
      matchesQuery([row.name, row.sku, row.description, row.categoryName, row.shopName], search)
  );
  const pageResult = paginate(filteredRows, page);
  const hasActiveCriteria = search !== '' || shopFilter !== SUPPLY_FILTER_ALL || categoryFilter !== SUPPLY_FILTER_ALL;

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleShopFilterChange = (value: string) => {
    setShopFilter(value);
    setPage(1);
  };

  const handleCategoryFilterChange = (value: string) => {
    setCategoryFilter(value);
    setPage(1);
  };

  /* ---------- Alta y edición ---------- */

  const openCreate = () => {
    reset(EMPTY_VALUES);
    setServerError('');
    setFormState({ mode: 'create' });
  };

  const openEdit = (row: SupplyRow) => {
    reset({
      name: row.name,
      shopId: row.shopId,
      categoryId: row.categoryId,
      unit: row.unit,
      sku: row.sku ?? '',
      description: row.description ?? ''
    });
    setServerError('');
    setFormState({ mode: 'edit', supply: row });
  };

  const closeForm = () => {
    setFormState(null);
    setServerError('');
  };

  const onSubmit = async (values: SupplyFormValues) => {
    if (!formState) return;
    setServerError('');

    if (!token) {
      setServerError('Tu sesión expiró. Inicia sesión de nuevo.');
      return;
    }

    const isEdit = formState.mode === 'edit';
    const payload: SupplyPayload = {
      shopId: values.shopId,
      categoryId: values.categoryId,
      name: values.name.trim(),
      description: values.description.trim() || null,
      unit: values.unit.trim(),
      sku: values.sku.trim() || null
    };

    try {
      const saved = isEdit
        ? await updateSupply(formState.supply.id, payload, token)
        : await createSupply(payload, token);

      setSupplies((current) =>
        isEdit ? current.map((supply) => (supply.id === saved.id ? saved : supply)) : [saved, ...current]
      );
      closeForm();
      setToast({
        message: isEdit ? 'Suministro actualizado correctamente.' : 'Suministro registrado correctamente.',
        type: 'success'
      });
    } catch (error) {
      setServerError(
        getSupplyErrorMessage(
          error,
          isEdit ? 'No se pudo actualizar el suministro.' : 'No se pudo registrar el suministro.'
        )
      );
    }
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    void handleSubmit(onSubmit)(event);
  };

  /* ---------- Eliminación ---------- */

  const openDelete = (row: SupplyRow) => {
    setDeleteError('');
    setDeleteTarget(row);
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
      await deleteSupply(deleteTarget.id, token);
      setSupplies((current) => current.filter((supply) => supply.id !== deleteTarget.id));
      setDeleteTarget(null);
      setToast({ message: 'Suministro eliminado correctamente.', type: 'success' });
    } catch (error) {
      setDeleteError(getSupplyErrorMessage(error, 'No se pudo eliminar el suministro.'));
    } finally {
      setIsDeleting(false);
    }
  };

  /* ---------- Reglas de validación (espejo de las del backend) ---------- */

  const nameRegister = register('name', {
    validate: (value) => {
      const name = value.trim();
      if (!name) return 'El nombre es obligatorio.';
      return name.length <= 150 || 'Máximo 150 caracteres.';
    }
  });

  const shopRegister = register('shopId', { required: 'Selecciona una sucursal.' });
  const categoryRegister = register('categoryId', { required: 'Selecciona una categoría.' });

  const unitRegister = register('unit', {
    validate: (value) => {
      const unit = value.trim();
      if (!unit) return 'La unidad es obligatoria.';
      return unit.length <= 30 || 'Máximo 30 caracteres.';
    }
  });

  const skuRegister = register('sku', {
    validate: (value) => value.trim().length <= 50 || 'Máximo 50 caracteres.'
  });

  const descriptionRegister = register('description');

  return (
    <>
      <ManagerPageHeader title="Suministros" subtitle="Administración de los insumos de cada sucursal.">
        <FilterMenu
          label="Sucursal"
          title="Sucursal"
          options={shopFilterOptions}
          value={shopFilter}
          defaultValue={SUPPLY_FILTER_ALL}
          onChange={handleShopFilterChange}
        />
        <FilterMenu
          label="Categoría"
          title="Categoría"
          options={categoryFilterOptions}
          value={categoryFilter}
          defaultValue={SUPPLY_FILTER_ALL}
          onChange={handleCategoryFilterChange}
        />
        <Button
          type="button"
          onClick={openCreate}
          disabled={isLoading || loadError !== ''}
          className="inline-flex items-center gap-2 px-4 !text-sm !font-semibold !normal-case disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={18} aria-hidden="true" />
          Nuevo Suministro
        </Button>
      </ManagerPageHeader>

      <div className="mt-6">
        <SearchBar
          value={search}
          onChange={handleSearchChange}
          placeholder="Buscar suministro por nombre, SKU, categoría o sucursal..."
          ariaLabel="Buscar suministro"
        />
      </div>

      <div className="mt-6">
        <SupplyTable
          rows={pageResult.pageItems}
          startIndex={pageResult.from === 0 ? 0 : pageResult.from - 1}
          isLoading={isLoading}
          error={loadError}
          emptyMessage={
            hasActiveCriteria
              ? 'No se encontraron suministros con esos criterios.'
              : 'Aún no hay suministros registrados.'
          }
          onRetry={() => void loadData()}
          onEdit={openEdit}
          onDelete={openDelete}
          pagination={{
            from: pageResult.from,
            to: pageResult.to,
            total: pageResult.total,
            itemLabel: 'suministros',
            currentPage: pageResult.currentPage,
            totalPages: pageResult.totalPages,
            onPageChange: setPage
          }}
        />
      </div>

      <SupplyFormModal
        isOpen={formState !== null}
        onClose={closeForm}
        onSubmit={handleFormSubmit}
        mode={formState?.mode ?? 'create'}
        shopOptions={shopOptions}
        categoryOptions={categoryOptions}
        nameRegister={nameRegister}
        shopRegister={shopRegister}
        categoryRegister={categoryRegister}
        unitRegister={unitRegister}
        skuRegister={skuRegister}
        descriptionRegister={descriptionRegister}
        errors={errors}
        serverError={serverError}
        isSubmitting={isSubmitting}
      />

      <ConfirmDeleteModal
        isOpen={deleteTarget !== null}
        onClose={closeDelete}
        onConfirm={() => void confirmDelete()}
        title="¿Eliminar suministro permanentemente?"
        description={
          deleteTarget ? (
            <>
              Esta acción eliminará <strong className="text-[var(--text-h)]">{deleteTarget.name}</strong> junto con sus
              existencias y movimientos registrados.
              <br />
              No se puede deshacer.
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
