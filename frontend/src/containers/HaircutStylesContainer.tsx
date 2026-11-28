import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus } from 'lucide-react';
import { Button } from '../components/common/ButtonComponent';
import { ConfirmDeleteModal } from '../components/common/ConfirmDeleteModalComponent';
import { FilterMenu } from '../components/common/FilterMenuComponent';
import { SearchBar } from '../components/common/SearchBarComponent';
import { Toast } from '../components/common/ToastComponent';
import { ManagerPageHeader } from '../components/dashboard/ManagerPageHeaderComponent';
import { HaircutStyleFormModal } from '../components/haircutStyles/HaircutStyleFormModalComponent';
import { HaircutStyleTable } from '../components/haircutStyles/HaircutStyleTableComponent';
import { useAuth } from '../context/AuthContext';
import { useHaircutImageUrls } from '../hooks/useHaircutImageUrls';
import {
  createHaircutStyle,
  deleteHaircutStyle,
  getFacialStructures,
  getHaircutStyles,
  updateHaircutStyle,
  uploadHaircutPhoto
} from '../services/haircutStyleService';
import { getHaircutImageUrl } from '../services/recommendationService';
import type {
  FacialStructure,
  HaircutStyle,
  HaircutStyleFormValues,
  HaircutStylePayload
} from '../types/haircutStyleType';
import { matchesQuery, paginate } from '../utils/listUtils';
import { getFacialStructureLabel, getHaircutStyleErrorMessage, validateHaircutImage } from '../utils/haircutStyleUtils';
import { matchesStatus, SERVICE_FILTER_ALL, SERVICE_STATUS_FILTER_OPTIONS } from '../utils/offeredServiceUtils';

type FormState = { mode: 'create' } | { mode: 'edit'; style: HaircutStyle } | null;

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

const EMPTY_VALUES: HaircutStyleFormValues = { name: '', description: '', facialStructures: [], isActive: 'true' };

/* Catálogo de estilos de corte (solo manager): alta, consulta con búsqueda, edición y baja lógica. */
export function HaircutStylesContainer() {
  const { token } = useAuth();

  const [styles, setStyles] = useState<HaircutStyle[]>([]);
  const [facialStructureOptions, setFacialStructureOptions] = useState<FacialStructure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(SERVICE_FILTER_ALL);
  const [page, setPage] = useState(1);

  const [formState, setFormState] = useState<FormState>(null);
  const [serverError, setServerError] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<HaircutStyle | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [toast, setToast] = useState<ToastState | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  /*
   * Fotos: useHaircutImageUrls carga las de la lista inicial. Los cambios posteriores (foto nueva o
   * renombrado, que mueve la foto en el bucket) se guardan aquí; null significa "sin foto".
   */
  const [imageOverrides, setImageOverrides] = useState<Record<string, string | null>>({});
  /* El hook necesita una referencia estable: solo cambia cuando se recarga la lista completa. */
  const [initialStyles, setInitialStyles] = useState<{ id: string; name: string }[]>([]);
  const objectUrlsRef = useRef<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<HaircutStyleFormValues>({ defaultValues: EMPTY_VALUES });

  const loadData = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setLoadError('');

    try {
      const [loadedStyles, loadedStructures] = await Promise.all([getHaircutStyles(token), getFacialStructures(token)]);
      setStyles(loadedStyles);
      setFacialStructureOptions(loadedStructures);
      setInitialStyles(loadedStyles.map(({ id, name }) => ({ id, name })));
      setImageOverrides({});
    } catch (error) {
      setLoadError(getHaircutStyleErrorMessage(error, 'No se pudieron cargar los estilos. Intenta de nuevo.'));
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  /* Libera las vistas previas locales al salir de la página. */
  useEffect(() => {
    const objectUrls = objectUrlsRef.current;
    return () => objectUrls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const loadedImageUrls = useHaircutImageUrls(initialStyles, initialStyles.length > 0);

  const imageUrls = useMemo(() => {
    const merged: Record<string, string> = { ...loadedImageUrls };
    Object.entries(imageOverrides).forEach(([id, url]) => {
      if (url) merged[id] = url;
      else delete merged[id];
    });
    return merged;
  }, [loadedImageUrls, imageOverrides]);

  const createObjectUrl = (file: File) => {
    const url = URL.createObjectURL(file);
    objectUrlsRef.current.push(url);
    return url;
  };

  /* Vuelve a pedir la URL de la foto (p. ej. tras renombrar, porque la key en el bucket cambia). */
  const refreshImageUrl = async (id: string) => {
    try {
      const { url } = await getHaircutImageUrl(id);
      setImageOverrides((current) => ({ ...current, [id]: url }));
    } catch {
      setImageOverrides((current) => ({ ...current, [id]: null }));
    }
  };

  /* ---------- Lista: búsqueda, filtro y paginación ---------- */

  const filteredStyles = styles.filter(
    (style) =>
      matchesStatus(style.isActive, statusFilter) &&
      matchesQuery(
        [style.name, style.description, style.facialStructures.map(getFacialStructureLabel).join(' ')],
        search
      )
  );
  const pageResult = paginate(filteredStyles, page);
  const hasActiveCriteria = search !== '' || statusFilter !== SERVICE_FILTER_ALL;

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  /* ---------- Foto del formulario ---------- */

  const clearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoError('');
  };

  const handlePhotoChange = (file: File | null) => {
    if (!file) {
      clearPhoto();
      return;
    }

    const error = validateHaircutImage(file);
    if (error) {
      setPhotoError(error);
      return;
    }

    setPhotoError('');
    setPhotoFile(file);
    setPhotoPreview(createObjectUrl(file));
  };

  /* ---------- Alta y edición ---------- */

  const openCreate = () => {
    reset(EMPTY_VALUES);
    clearPhoto();
    setServerError('');
    setFormState({ mode: 'create' });
  };

  const openEdit = (style: HaircutStyle) => {
    reset({
      name: style.name,
      description: style.description ?? '',
      facialStructures: style.facialStructures,
      isActive: style.isActive ? 'true' : 'false'
    });
    clearPhoto();
    setServerError('');
    setFormState({ mode: 'edit', style });
  };

  const closeForm = () => {
    if (isSubmitting) return;
    setFormState(null);
    setServerError('');
    clearPhoto();
  };

  const onSubmit = async (values: HaircutStyleFormValues) => {
    if (!formState) return;
    setServerError('');

    if (!token) {
      setServerError('Tu sesión expiró. Inicia sesión de nuevo.');
      return;
    }

    const isEdit = formState.mode === 'edit';
    const payload: HaircutStylePayload = {
      name: values.name.trim(),
      description: values.description.trim() || null,
      facialStructures: values.facialStructures,
      ...(isEdit ? { isActive: values.isActive === 'true' } : {})
    };

    let saved: HaircutStyle;
    try {
      saved = isEdit
        ? await updateHaircutStyle(formState.style.id, payload, token)
        : await createHaircutStyle(payload, token);
    } catch (error) {
      setServerError(
        getHaircutStyleErrorMessage(
          error,
          isEdit ? 'No se pudo actualizar el estilo.' : 'No se pudo registrar el estilo.'
        )
      );
      return;
    }

    setStyles((current) =>
      isEdit ? current.map((style) => (style.id === saved.id ? saved : style)) : [saved, ...current]
    );

    const successMessage = isEdit ? 'Estilo actualizado correctamente.' : 'Estilo registrado correctamente.';
    let photoFailed = false;

    if (photoFile) {
      try {
        await uploadHaircutPhoto(saved.id, photoFile, token);
        setImageOverrides((current) => ({ ...current, [saved.id]: photoPreview }));
      } catch {
        photoFailed = true;
      }
    } else if (isEdit && saved.name !== formState.style.name) {
      // El backend movió la foto a la key del nombre nuevo: la URL anterior ya no sirve
      void refreshImageUrl(saved.id);
    }

    setFormState(null);
    setServerError('');
    setPhotoFile(null);
    setPhotoPreview(null);
    setToast(
      photoFailed
        ? { message: `${successMessage.slice(0, -1)}, pero no se pudo subir la foto. Intenta de nuevo.`, type: 'error' }
        : { message: successMessage, type: 'success' }
    );
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    void handleSubmit(onSubmit)(event);
  };

  /* ---------- Baja (borrado lógico) ---------- */

  const openDelete = (style: HaircutStyle) => {
    setDeleteError('');
    setDeleteTarget(style);
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
      await deleteHaircutStyle(deleteTarget.id, token);
      /* El backend no borra la fila: marca el estilo como inactivo. */
      setStyles((current) =>
        current.map((style) => (style.id === deleteTarget.id ? { ...style, isActive: false } : style))
      );
      setDeleteTarget(null);
      setToast({ message: 'Estilo dado de baja correctamente.', type: 'success' });
    } catch (error) {
      setDeleteError(getHaircutStyleErrorMessage(error, 'No se pudo dar de baja el estilo.'));
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

  const descriptionRegister = register('description');
  const facialStructuresRegister = register('facialStructures', {
    validate: (value) => (Array.isArray(value) && value.length > 0) || 'Selecciona al menos una estructura facial.'
  });
  const isActiveRegister = register('isActive');

  const editingStyle = formState?.mode === 'edit' ? formState.style : null;
  const formPhotoUrl = photoPreview ?? (editingStyle ? (imageUrls[editingStyle.id] ?? null) : null);

  return (
    <>
      <ManagerPageHeader title="Estilos de corte" subtitle="Catálogo de cortes que usa la recomendación con IA.">
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
          disabled={isLoading || loadError !== ''}
          className="inline-flex items-center gap-2 px-4 !text-sm !font-semibold !normal-case disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={18} aria-hidden="true" />
          Nuevo Estilo
        </Button>
      </ManagerPageHeader>

      <div className="mt-6">
        <SearchBar
          value={search}
          onChange={handleSearchChange}
          placeholder="Buscar estilo por nombre, descripción o estructura facial..."
          ariaLabel="Buscar estilo de corte"
        />
      </div>

      <div className="mt-6">
        <HaircutStyleTable
          rows={pageResult.pageItems}
          imageUrls={imageUrls}
          startIndex={pageResult.from === 0 ? 0 : pageResult.from - 1}
          isLoading={isLoading}
          error={loadError}
          emptyMessage={
            hasActiveCriteria
              ? 'No se encontraron estilos con esos criterios.'
              : 'El catálogo de estilos está vacío. Registra el primero con "Nuevo Estilo".'
          }
          onRetry={() => void loadData()}
          onEdit={openEdit}
          onDelete={openDelete}
          canDelete={(style) => style.isActive}
          pagination={{
            from: pageResult.from,
            to: pageResult.to,
            total: pageResult.total,
            itemLabel: 'estilos',
            currentPage: pageResult.currentPage,
            totalPages: pageResult.totalPages,
            onPageChange: setPage
          }}
        />
      </div>

      <HaircutStyleFormModal
        isOpen={formState !== null}
        onClose={closeForm}
        onSubmit={handleFormSubmit}
        mode={formState?.mode ?? 'create'}
        nameRegister={nameRegister}
        descriptionRegister={descriptionRegister}
        facialStructuresRegister={facialStructuresRegister}
        isActiveRegister={isActiveRegister}
        facialStructureOptions={facialStructureOptions}
        photoPreviewUrl={formPhotoUrl}
        hasNewPhoto={photoFile !== null}
        onPhotoChange={handlePhotoChange}
        photoError={photoError}
        errors={errors}
        serverError={serverError}
        isSubmitting={isSubmitting}
      />

      <ConfirmDeleteModal
        isOpen={deleteTarget !== null}
        onClose={closeDelete}
        onConfirm={() => void confirmDelete()}
        title="¿Dar de baja el estilo?"
        description={
          deleteTarget ? (
            <>
              El estilo <strong className="text-[var(--text-h)]">{deleteTarget.name}</strong> quedará inactivo y dejará
              de usarse en las recomendaciones.
              <br />
              Estructuras faciales: {deleteTarget.facialStructures.map(getFacialStructureLabel).join(', ') || '—'}.
              <br />
              Puedes reactivarlo después desde Editar.
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
