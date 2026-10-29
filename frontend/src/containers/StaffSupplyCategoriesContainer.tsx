import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus } from 'lucide-react';
import { Button } from '../components/common/ButtonComponent';
import { ConfirmDeleteModal } from '../components/common/ConfirmDeleteModalComponent';
import { ManagerPageHeader } from '../components/dashboard/ManagerPageHeaderComponent';
import { SearchBar } from '../components/common/SearchBarComponent';
import { SupplyCategoryFormModal } from '../components/supplies/SupplyCategoryFormModalComponent';
import { SupplyCategoryTable } from '../components/supplies/SupplyCategoryTableComponent';
import { Toast } from '../components/common/ToastComponent';
import { useAuth } from '../context/AuthContext';
import {
  createSupplyCategory,
  deleteSupplyCategory,
  getSupplyCategories,
  updateSupplyCategory
} from '../services/supplyCategoryService';
import type { SupplyCategory, SupplyCategoryFormValues, SupplyCategoryPayload } from '../types/supplyCategoryType';
import { matchesQuery, paginate } from '../utils/listUtils';
import { getSupplyCategoryErrorMessage } from '../utils/supplyUtils';

type FormState = { mode: 'create' } | { mode: 'edit'; category: SupplyCategory } | null;

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

const EMPTY_VALUES: SupplyCategoryFormValues = { name: '', description: '' };

export function StaffSupplyCategoriesContainer() {
  const { token } = useAuth();

  const [categories, setCategories] = useState<SupplyCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [formState, setFormState] = useState<FormState>(null);
  const [serverError, setServerError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<SupplyCategory | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [toast, setToast] = useState<ToastState | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<SupplyCategoryFormValues>({ defaultValues: EMPTY_VALUES });

  const loadCategories = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setLoadError('');

    try {
      setCategories(await getSupplyCategories(token));
    } catch (error) {
      setLoadError(getSupplyCategoryErrorMessage(error, 'No se pudieron cargar las categorías. Intenta de nuevo.'));
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  /* ---------- Lista: búsqueda y paginación ---------- */

  const filteredCategories = categories.filter((category) =>
    matchesQuery([category.name, category.description], search)
  );
  const pageResult = paginate(filteredCategories, page);

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

  const openEdit = (category: SupplyCategory) => {
    reset({ name: category.name, description: category.description ?? '' });
    setServerError('');
    setFormState({ mode: 'edit', category });
  };

  const closeForm = () => {
    setFormState(null);
    setServerError('');
  };

  const onSubmit = async (values: SupplyCategoryFormValues) => {
    if (!formState) return;
    setServerError('');

    if (!token) {
      setServerError('Tu sesión expiró. Inicia sesión de nuevo.');
      return;
    }

    const isEdit = formState.mode === 'edit';
    const payload: SupplyCategoryPayload = {
      name: values.name.trim(),
      description: values.description.trim() || null
    };

    try {
      const saved = isEdit
        ? await updateSupplyCategory(formState.category.id, payload, token)
        : await createSupplyCategory(payload, token);

      setCategories((current) =>
        isEdit ? current.map((category) => (category.id === saved.id ? saved : category)) : [saved, ...current]
      );
      closeForm();
      setToast({
        message: isEdit ? 'Categoría actualizada correctamente.' : 'Categoría registrada correctamente.',
        type: 'success'
      });
    } catch (error) {
      setServerError(
        getSupplyCategoryErrorMessage(
          error,
          isEdit ? 'No se pudo actualizar la categoría.' : 'No se pudo registrar la categoría.'
        )
      );
    }
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    void handleSubmit(onSubmit)(event);
  };

  /* ---------- Eliminación ---------- */

  const openDelete = (category: SupplyCategory) => {
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
      await deleteSupplyCategory(deleteTarget.id, token);
      setCategories((current) => current.filter((category) => category.id !== deleteTarget.id));
      setDeleteTarget(null);
      setToast({ message: 'Categoría eliminada correctamente.', type: 'success' });
    } catch (error) {
      setDeleteError(getSupplyCategoryErrorMessage(error, 'No se pudo eliminar la categoría.'));
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

  return (
    <>
      <ManagerPageHeader title="Categorías de suministros" subtitle="Organización de los insumos por categoría.">
        <Button
          type="button"
          onClick={openCreate}
          disabled={isLoading || loadError !== ''}
          className="inline-flex items-center gap-2 px-4 !text-sm !font-semibold !normal-case disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={18} aria-hidden="true" />
          Nueva Categoría
        </Button>
      </ManagerPageHeader>

      <div className="mt-6">
        <SearchBar
          value={search}
          onChange={handleSearchChange}
          placeholder="Buscar categoría por nombre o descripción..."
          ariaLabel="Buscar categoría"
        />
      </div>

      <div className="mt-6">
        <SupplyCategoryTable
          rows={pageResult.pageItems}
          startIndex={pageResult.from === 0 ? 0 : pageResult.from - 1}
          isLoading={isLoading}
          error={loadError}
          emptyMessage={
            search ? 'No se encontraron categorías con esos criterios.' : 'Aún no hay categorías registradas.'
          }
          onRetry={() => void loadCategories()}
          onEdit={openEdit}
          onDelete={openDelete}
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

      <SupplyCategoryFormModal
        isOpen={formState !== null}
        onClose={closeForm}
        onSubmit={handleFormSubmit}
        mode={formState?.mode ?? 'create'}
        nameRegister={nameRegister}
        descriptionRegister={descriptionRegister}
        errors={errors}
        serverError={serverError}
        isSubmitting={isSubmitting}
      />

      <ConfirmDeleteModal
        isOpen={deleteTarget !== null}
        onClose={closeDelete}
        onConfirm={() => void confirmDelete()}
        title="¿Eliminar categoría permanentemente?"
        description={
          deleteTarget ? (
            <>
              Esta acción eliminará la categoría <strong className="text-[var(--text-h)]">{deleteTarget.name}</strong>.
              <br />
              Solo se puede eliminar si no tiene suministros asignados.
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
