import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus } from 'lucide-react';
import { Button } from '../components/ButtonComponent';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModalComponent';
import { FilterMenu } from '../components/FilterMenuComponent';
import { ManagerPageHeader } from '../components/ManagerPageHeaderComponent';
import { OfferedServiceFormModal } from '../components/OfferedServiceFormModalComponent';
import { OfferedServiceTable, type OfferedServiceRow } from '../components/OfferedServiceTableComponent';
import { ReadOnlyNotice } from '../components/ReadOnlyNoticeComponent';
import { SearchBar } from '../components/SearchBarComponent';
import { Toast } from '../components/ToastComponent';
import { useAuth } from '../context/AuthContext';
import {
  createOfferedService,
  deleteOfferedService,
  getOfferedServicesCatalog,
  updateOfferedService
} from '../services/offeredServiceService';
import { getServiceCategories } from '../services/serviceCategoryService';
import type { OfferedService, OfferedServiceFormValues, OfferedServicePayload } from '../types/offeredService';
import type { ServiceCategory } from '../types/serviceCategoryType';
import { matchesQuery, paginate } from '../utils/listUtils';
import {
  getOfferedServiceErrorMessage,
  matchesStatus,
  SERVICE_FILTER_ALL,
  SERVICE_STATUS_FILTER_OPTIONS
} from '../utils/offeredServiceUtils';

type FormState = { mode: 'create' } | { mode: 'edit'; service: OfferedService } | null;

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

const EMPTY_VALUES: OfferedServiceFormValues = {
  name: '',
  categoryId: '',
  durationMinutes: '',
  price: '',
  description: '',
  isActive: 'true'
};

interface OfferedServicesContainerProps {
  /* Solo el manager puede crear, editar y eliminar; la recepcionista entra en modo consulta. */
  canManage: boolean;
}

export function OfferedServicesContainer({ canManage }: OfferedServicesContainerProps) {
  const { token } = useAuth();

  const [services, setServices] = useState<OfferedService[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(SERVICE_FILTER_ALL);
  const [statusFilter, setStatusFilter] = useState(SERVICE_FILTER_ALL);
  const [page, setPage] = useState(1);

  const [formState, setFormState] = useState<FormState>(null);
  const [serverError, setServerError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<OfferedService | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [toast, setToast] = useState<ToastState | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<OfferedServiceFormValues>({ defaultValues: EMPTY_VALUES });

  const loadData = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setLoadError('');

    try {
      const [loadedServices, loadedCategories] = await Promise.all([
        getOfferedServicesCatalog(token),
        getServiceCategories(token)
      ]);
      setServices(loadedServices);
      setCategories(loadedCategories);
    } catch (error) {
      setLoadError(getOfferedServiceErrorMessage(error, 'No se pudieron cargar los servicios. Intenta de nuevo.'));
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  /* ---------- Catálogos para filtros y formulario ---------- */

  const categoryFilterOptions = useMemo(
    () => [
      { value: SERVICE_FILTER_ALL, label: 'Todas' },
      ...categories.map((category) => ({ value: category.id, label: category.name }))
    ],
    [categories]
  );

  /* En el formulario solo se ofrecen categorías activas (más la actual si se edita un servicio de una inactiva). */
  const editingCategoryId = formState?.mode === 'edit' ? formState.service.categoryId : null;
  const formCategoryOptions = useMemo(
    () =>
      categories
        .filter((category) => category.isActive || category.id === editingCategoryId)
        .map((category) => ({
          value: category.id,
          label: category.isActive ? category.name : `${category.name} (inactiva)`
        })),
    [categories, editingCategoryId]
  );

  /* ---------- Lista: filtros, búsqueda y paginación ---------- */

  const rows: OfferedServiceRow[] = services.map((service) => ({
    ...service,
    categoryName: categories.find((category) => category.id === service.categoryId)?.name ?? '—'
  }));

  const filteredRows = rows.filter(
    (row) =>
      (categoryFilter === SERVICE_FILTER_ALL || row.categoryId === categoryFilter) &&
      matchesStatus(row.isActive, statusFilter) &&
      matchesQuery([row.name, row.description, row.categoryName], search)
  );
  const pageResult = paginate(filteredRows, page);
  const hasActiveCriteria =
    search !== '' || categoryFilter !== SERVICE_FILTER_ALL || statusFilter !== SERVICE_FILTER_ALL;

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleCategoryFilterChange = (value: string) => {
    setCategoryFilter(value);
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

  const openEdit = (row: OfferedServiceRow) => {
    reset({
      name: row.name,
      categoryId: row.categoryId,
      durationMinutes: String(row.durationMinutes),
      price: String(row.price),
      description: row.description ?? '',
      isActive: row.isActive ? 'true' : 'false'
    });
    setServerError('');
    setFormState({ mode: 'edit', service: row });
  };

  const closeForm = () => {
    setFormState(null);
    setServerError('');
  };

  const onSubmit = async (values: OfferedServiceFormValues) => {
    if (!formState) return;
    setServerError('');

    if (!token) {
      setServerError('Tu sesión expiró. Inicia sesión de nuevo.');
      return;
    }

    const isEdit = formState.mode === 'edit';
    const payload: OfferedServicePayload = {
      categoryId: values.categoryId,
      name: values.name.trim(),
      description: values.description.trim() || null,
      durationMinutes: Number(values.durationMinutes),
      price: Number(values.price),
      isActive: values.isActive === 'true'
    };

    try {
      const saved = isEdit
        ? await updateOfferedService(formState.service.id, payload, token)
        : await createOfferedService(payload, token);

      setServices((current) =>
        isEdit ? current.map((service) => (service.id === saved.id ? saved : service)) : [saved, ...current]
      );
      closeForm();
      setToast({
        message: isEdit ? 'Servicio actualizado correctamente.' : 'Servicio registrado correctamente.',
        type: 'success'
      });
    } catch (error) {
      setServerError(
        getOfferedServiceErrorMessage(
          error,
          isEdit ? 'No se pudo actualizar el servicio.' : 'No se pudo registrar el servicio.'
        )
      );
    }
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    void handleSubmit(onSubmit)(event);
  };

  /* ---------- Eliminación (borrado lógico) ---------- */

  const openDelete = (row: OfferedServiceRow) => {
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
      await deleteOfferedService(deleteTarget.id, token);
      /* El backend no borra la fila: la marca como inactiva. */
      setServices((current) =>
        current.map((service) => (service.id === deleteTarget.id ? { ...service, isActive: false } : service))
      );
      setDeleteTarget(null);
      setToast({ message: 'Servicio eliminado correctamente.', type: 'success' });
    } catch (error) {
      setDeleteError(getOfferedServiceErrorMessage(error, 'No se pudo eliminar el servicio.'));
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

  const categoryRegister = register('categoryId', { required: 'Selecciona una categoría.' });

  const durationRegister = register('durationMinutes', {
    validate: (value) => {
      if (value.trim() === '') return 'La duración es obligatoria.';
      const minutes = Number(value);
      if (!Number.isInteger(minutes)) return 'Debe ser un número entero de minutos.';
      return minutes > 0 || 'Debe ser mayor a 0.';
    }
  });

  const priceRegister = register('price', {
    validate: (value) => {
      if (value.trim() === '') return 'El precio es obligatorio.';
      const price = Number(value);
      if (Number.isNaN(price)) return 'Ingresa un precio válido.';
      if (price < 0) return 'No puede ser negativo.';
      return /^\d+(\.\d{1,2})?$/.test(value.trim()) || 'Máximo 2 decimales.';
    }
  });

  const descriptionRegister = register('description');
  const isActiveRegister = register('isActive');

  return (
    <>
      <ManagerPageHeader
        title="Servicios ofrecidos"
        subtitle={
          canManage
            ? 'Administración de los servicios, su duración y su precio.'
            : 'Consulta de los servicios, su duración y su precio.'
        }
      >
        <FilterMenu
          label="Categoría"
          title="Categoría"
          options={categoryFilterOptions}
          value={categoryFilter}
          defaultValue={SERVICE_FILTER_ALL}
          onChange={handleCategoryFilterChange}
        />
        <FilterMenu
          label="Estado"
          title="Estado"
          options={SERVICE_STATUS_FILTER_OPTIONS}
          value={statusFilter}
          defaultValue={SERVICE_FILTER_ALL}
          onChange={handleStatusFilterChange}
        />
        {canManage && (
          <Button
            type="button"
            onClick={openCreate}
            disabled={isLoading || loadError !== ''}
            className="inline-flex items-center gap-2 px-4 !text-sm !font-semibold !normal-case disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={18} aria-hidden="true" />
            Nuevo Servicio
          </Button>
        )}
      </ManagerPageHeader>

      {!canManage && (
        <ReadOnlyNotice message="Modo consulta: solo el gerente puede registrar, editar o eliminar servicios." />
      )}

      <div className="mt-6">
        <SearchBar
          value={search}
          onChange={handleSearchChange}
          placeholder="Buscar servicio por nombre, descripción o categoría..."
          ariaLabel="Buscar servicio"
        />
      </div>

      <div className="mt-6">
        <OfferedServiceTable
          rows={pageResult.pageItems}
          startIndex={pageResult.from === 0 ? 0 : pageResult.from - 1}
          isLoading={isLoading}
          error={loadError}
          emptyMessage={
            hasActiveCriteria ? 'No se encontraron servicios con esos criterios.' : 'Aún no hay servicios registrados.'
          }
          onRetry={() => void loadData()}
          onEdit={canManage ? openEdit : undefined}
          onDelete={canManage ? openDelete : undefined}
          canDelete={(row) => row.isActive}
          pagination={{
            from: pageResult.from,
            to: pageResult.to,
            total: pageResult.total,
            itemLabel: 'servicios',
            currentPage: pageResult.currentPage,
            totalPages: pageResult.totalPages,
            onPageChange: setPage
          }}
        />
      </div>

      {canManage && (
        <>
          <OfferedServiceFormModal
            isOpen={formState !== null}
            onClose={closeForm}
            onSubmit={handleFormSubmit}
            mode={formState?.mode ?? 'create'}
            categoryOptions={formCategoryOptions}
            nameRegister={nameRegister}
            categoryRegister={categoryRegister}
            durationRegister={durationRegister}
            priceRegister={priceRegister}
            descriptionRegister={descriptionRegister}
            isActiveRegister={isActiveRegister}
            errors={errors}
            serverError={serverError}
            isSubmitting={isSubmitting}
          />

          <ConfirmDeleteModal
            isOpen={deleteTarget !== null}
            onClose={closeDelete}
            onConfirm={() => void confirmDelete()}
            title="¿Eliminar servicio?"
            description={
              deleteTarget ? (
                <>
                  <strong className="text-[var(--text-h)]">{deleteTarget.name}</strong> dejará de estar disponible
                  para agendar citas.
                  <br />
                  Se conserva el historial y puedes reactivarlo después desde Editar.
                </>
              ) : null
            }
            confirmLabel="Sí, eliminar"
            serverError={deleteError}
            isSubmitting={isDeleting}
          />
        </>
      )}

      <Toast message={toast?.message ?? null} type={toast?.type} onDismiss={dismissToast} />
    </>
  );
}
