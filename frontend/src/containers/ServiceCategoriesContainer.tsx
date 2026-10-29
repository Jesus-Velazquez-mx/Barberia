import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus } from 'lucide-react';
import { Button } from '../components/common/ButtonComponent';
import { ConfirmDeleteModal } from '../components/common/ConfirmDeleteModalComponent';
import { FilterMenu } from '../components/common/FilterMenuComponent';
import { ManagerPageHeader } from '../components/dashboard/ManagerPageHeaderComponent';
import { ReadOnlyNotice } from '../components/common/ReadOnlyNoticeComponent';
import { SearchBar } from '../components/common/SearchBarComponent';
import { ServiceCategoryFormModal } from '../components/serviceCategories/ServiceCategoryFormModalComponent';
import { ServiceCategoryTable, type ServiceCategoryRow } from '../components/serviceCategories/ServiceCategoryTableComponent';
import { Toast } from '../components/common/ToastComponent';
import { useAuth } from '../context/AuthContext';
import { getOfferedServicesCatalog } from '../services/offeredServiceService';
import {
  createServiceCategory,
  deleteServiceCategory,
  getServiceCategories,
  updateServiceCategory
} from '../services/serviceCategoryService';
import type { OfferedService } from '../types/offeredService';
import type { ServiceCategory, ServiceCategoryFormValues, ServiceCategoryPayload } from '../types/serviceCategoryType';
import { matchesQuery, paginate } from '../utils/listUtils';
import {
  getServiceCategoryErrorMessage,
  matchesStatus,
  SERVICE_FILTER_ALL,
  SERVICE_STATUS_FILTER_OPTIONS
} from '../utils/offeredServiceUtils';

type FormState = { mode: 'create' } | { mode: 'edit'; category: ServiceCategoryRow } | null;

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

const EMPTY_VALUES: ServiceCategoryFormValues = { name: '', description: '', isActive: 'true' };

const pluralizeServices = (count: number) => (count === 1 ? '1 servicio activo' : `${count} servicios activos`);

interface ServiceCategoriesContainerProps {
  /* Solo el manager puede crear, editar y eliminar; la recepcionista entra en modo consulta. */
  canManage: boolean;
}

export function ServiceCategoriesContainer({ canManage }: ServiceCategoriesContainerProps) {
  const { token } = useAuth();

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  /* Los servicios solo se usan para mostrar cuántos tiene cada categoría. */
  const [services, setServices] = useState<OfferedService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(SERVICE_FILTER_ALL);
  const [page, setPage] = useState(1);

  const [formState, setFormState] = useState<FormState>(null);
  const [serverError, setServerError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<ServiceCategoryRow | null>(null);
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
  } = useForm<ServiceCategoryFormValues>({ defaultValues: EMPTY_VALUES });

  const loadData = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setLoadError('');

    try {
      const [loadedCategories, loadedServices] = await Promise.all([
        getServiceCategories(token),
        getOfferedServicesCatalog(token)
      ]);
      setCategories(loadedCategories);
      setServices(loadedServices);
    } catch (error) {
      setLoadError(getServiceCategoryErrorMessage(error, 'No se pudieron cargar las categorías. Intenta de nuevo.'));
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  /* Al desactivar una categoría el backend desactiva sus servicios; se recargan para que los conteos cuadren. */
  const refreshServices = async () => {
    if (!token) return;
    try {
      setServices(await getOfferedServicesCatalog(token));
    } catch {
      /* Los conteos quedan desactualizados hasta la próxima carga; no bloquea la operación. */
    }
  };

  /* ---------- Lista: búsqueda, filtro y paginación ---------- */

  const rows: ServiceCategoryRow[] = categories.map((category) => {
    const ofCategory = services.filter((service) => service.categoryId === category.id);
    return {
      ...category,
      totalServices: ofCategory.length,
      activeServices: ofCategory.filter((service) => service.isActive).length
    };
  });

  const filteredRows = rows.filter(
    (row) => matchesStatus(row.isActive, statusFilter) && matchesQuery([row.name, row.description], search)
  );
  const pageResult = paginate(filteredRows, page);
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

  const openEdit = (category: ServiceCategoryRow) => {
    reset({
      name: category.name,
      description: category.description ?? '',
      isActive: category.isActive ? 'true' : 'false'
    });
    setServerError('');
    setFormState({ mode: 'edit', category });
  };

  const closeForm = () => {
    setFormState(null);
    setServerError('');
  };

  const onSubmit = async (values: ServiceCategoryFormValues) => {
    if (!formState) return;
    setServerError('');

    if (!token) {
      setServerError('Tu sesión expiró. Inicia sesión de nuevo.');
      return;
    }

    const isEdit = formState.mode === 'edit';
    const payload: ServiceCategoryPayload = {
      name: values.name.trim(),
      description: values.description.trim() || null,
      isActive: values.isActive === 'true'
    };

    try {
      const saved = isEdit
        ? await updateServiceCategory(formState.category.id, payload, token)
        : await createServiceCategory(payload, token);

      setCategories((current) =>
        isEdit ? current.map((category) => (category.id === saved.id ? saved : category)) : [saved, ...current]
      );
      if (isEdit && formState.category.isActive && !saved.isActive) await refreshServices();

      closeForm();
      setToast({
        message: isEdit ? 'Categoría actualizada correctamente.' : 'Categoría registrada correctamente.',
        type: 'success'
      });
    } catch (error) {
      setServerError(
        getServiceCategoryErrorMessage(
          error,
          isEdit ? 'No se pudo actualizar la categoría.' : 'No se pudo registrar la categoría.'
        )
      );
    }
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    void handleSubmit(onSubmit)(event);
  };

  /* Aviso de desactivación en cascada mientras el manager cambia el estado a "Inactivo". */
  const watchedIsActive = watch('isActive');
  const editingCategory = formState?.mode === 'edit' ? formState.category : null;
  const deactivationWarning =
    editingCategory && editingCategory.isActive && watchedIsActive === 'false' && editingCategory.activeServices > 0
      ? `Al desactivar esta categoría también se desactivarán sus ${pluralizeServices(editingCategory.activeServices)}.`
      : null;

  /* ---------- Eliminación (borrado lógico en cascada) ---------- */

  const openDelete = (category: ServiceCategoryRow) => {
    setDeleteError('');
    setDeleteTarget(category);
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
      await deleteServiceCategory(deleteTarget.id, token);
      /* El backend no borra la fila: marca la categoría y sus servicios como inactivos. */
      setCategories((current) =>
        current.map((category) => (category.id === deleteTarget.id ? { ...category, isActive: false } : category))
      );
      setServices((current) =>
        current.map((service) => (service.categoryId === deleteTarget.id ? { ...service, isActive: false } : service))
      );
      setDeleteTarget(null);
      setToast({ message: 'Categoría eliminada correctamente.', type: 'success' });
    } catch (error) {
      setDeleteError(getServiceCategoryErrorMessage(error, 'No se pudo eliminar la categoría.'));
    } finally {
      setIsDeleting(false);
    }
  };

  /* ---------- Reglas de validación (espejo de las del backend) ---------- */

  const nameRegister = register('name', {
    validate: (value) => {
      const name = value.trim();
      if (!name) return 'El nombre es obligatorio.';
      return name.length <= 100 || 'Máximo 100 caracteres.';
    }
  });

  const descriptionRegister = register('description');
  const isActiveRegister = register('isActive');

  return (
    <>
      <ManagerPageHeader
        title="Categorías de servicios"
        subtitle={
          canManage ? 'Organización de los servicios por categoría.' : 'Consulta de las categorías de servicios.'
        }
      >
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
            Nueva Categoría
          </Button>
        )}
      </ManagerPageHeader>

      {!canManage && (
        <ReadOnlyNotice message="Modo consulta: solo el gerente puede registrar, editar o eliminar categorías." />
      )}

      <div className="mt-6">
        <SearchBar
          value={search}
          onChange={handleSearchChange}
          placeholder="Buscar categoría por nombre o descripción..."
          ariaLabel="Buscar categoría"
        />
      </div>

      <div className="mt-6">
        <ServiceCategoryTable
          rows={pageResult.pageItems}
          startIndex={pageResult.from === 0 ? 0 : pageResult.from - 1}
          isLoading={isLoading}
          error={loadError}
          emptyMessage={
            hasActiveCriteria ? 'No se encontraron categorías con esos criterios.' : 'Aún no hay categorías registradas.'
          }
          onRetry={() => void loadData()}
          onEdit={canManage ? openEdit : undefined}
          onDelete={canManage ? openDelete : undefined}
          canDelete={(row) => row.isActive}
          pagination={{
            from: pageResult.from,
            to: pageResult.to,
            total: pageResult.total,
            itemLabel: 'categorías',
            currentPage: pageResult.currentPage,
            totalPages: pageResult.totalPages,
            onPageChange: setPage
          }}
        />
      </div>

      {canManage && (
        <>
          <ServiceCategoryFormModal
            isOpen={formState !== null}
            onClose={closeForm}
            onSubmit={handleFormSubmit}
            mode={formState?.mode ?? 'create'}
            nameRegister={nameRegister}
            descriptionRegister={descriptionRegister}
            isActiveRegister={isActiveRegister}
            deactivationWarning={deactivationWarning}
            errors={errors}
            serverError={serverError}
            isSubmitting={isSubmitting}
          />

          <ConfirmDeleteModal
            isOpen={deleteTarget !== null}
            onClose={closeDelete}
            onConfirm={() => void confirmDelete()}
            title="¿Eliminar categoría?"
            description={
              deleteTarget ? (
                <>
                  La categoría <strong className="text-[var(--text-h)]">{deleteTarget.name}</strong> quedará inactiva
                  {deleteTarget.activeServices > 0 ? (
                    <> junto con sus {pluralizeServices(deleteTarget.activeServices)}</>
                  ) : null}
                  .
                  <br />
                  Se conserva el historial de citas y puedes reactivarla después desde Editar.
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
