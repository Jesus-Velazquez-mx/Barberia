import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus } from 'lucide-react';
import { Button } from '../components/common/ButtonComponent';
import { ConfirmDeleteModal } from '../components/common/ConfirmDeleteModalComponent';
import { ManagerPageHeader } from '../components/dashboard/ManagerPageHeaderComponent';
import { SearchBar } from '../components/common/SearchBarComponent';
import { ShiftFormModal } from '../components/shifts/ShiftFormModalComponent';
import { ShiftTable } from '../components/shifts/ShiftTableComponent';
import { Toast } from '../components/common/ToastComponent';
import type { Shift, ShiftFormValues } from '../types/shiftType';
import { createShift, deleteShift, getShifts, updateShift } from '../services/shiftService';
import { formatShiftRange, getShiftLabel, normalizeTime, validateShiftTimes } from '../utils/shiftUtils';
import { matchesQuery, paginate } from '../utils/listUtils';

type FormState = { mode: 'create' } | { mode: 'edit'; shift: Shift } | null;

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

const EMPTY_VALUES: ShiftFormValues = { name: '', startTime: '', endTime: '' };

/* El servicio con mock lanza Error con el mensaje listo. Con la API real, cambia esto por
   getApiErrorMessage(error, fallback), como en ManagerStaffContainer. */
const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback;

export function ManagerShiftsContainer() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [formState, setFormState] = useState<FormState>(null);
  const [serverError, setServerError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<Shift | null>(null);
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
  } = useForm<ShiftFormValues>({ defaultValues: EMPTY_VALUES });
  const startTime = watch('startTime');
  const endTime = watch('endTime');

  const loadShifts = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      setShifts(await getShifts());
    } catch (error) {
      setLoadError(getErrorMessage(error, 'No se pudieron cargar los turnos. Intenta de nuevo.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadShifts();
  }, [loadShifts]);

  /* ---------- Lista: búsqueda y paginación ---------- */

  const filteredShifts = shifts.filter((shift) =>
    matchesQuery([getShiftLabel(shift.name), shift.name, formatShiftRange(shift.startTime, shift.endTime)], search)
  );
  const pageResult = paginate(filteredShifts, page);

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

  const openEdit = (shift: Shift) => {
    reset({
      name: getShiftLabel(shift.name),
      startTime: normalizeTime(shift.startTime),
      endTime: normalizeTime(shift.endTime)
    });
    setServerError('');
    setFormState({ mode: 'edit', shift });
  };

  const closeForm = () => {
    setFormState(null);
    setServerError('');
  };

  const onSubmit = async (values: ShiftFormValues) => {
    if (!formState) return;
    setServerError('');

    const isEdit = formState.mode === 'edit';
    const payload: ShiftFormValues = { ...values, name: values.name.trim() };

    try {
      const saved = isEdit ? await updateShift(formState.shift.id, payload) : await createShift(payload);

      setShifts((current) =>
        isEdit ? current.map((shift) => (shift.id === saved.id ? saved : shift)) : [saved, ...current]
      );
      closeForm();
      setToast({
        message: isEdit ? 'Turno actualizado correctamente.' : 'Turno registrado correctamente.',
        type: 'success'
      });
    } catch (error) {
      setServerError(
        getErrorMessage(error, isEdit ? 'No se pudo actualizar el turno.' : 'No se pudo registrar el turno.')
      );
    }
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    void handleSubmit(onSubmit)(event);
  };

  /* ---------- Baja ---------- */

  const openDelete = (shift: Shift) => {
    setDeleteError('');
    setDeleteTarget(shift);
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
      await deleteShift(deleteTarget);
      setShifts((current) => current.filter((shift) => shift.id !== deleteTarget.id));
      setDeleteTarget(null);
      setToast({ message: 'Turno eliminado correctamente.', type: 'success' });
    } catch (error) {
      setDeleteError(getErrorMessage(error, 'No se pudo eliminar el turno.'));
    } finally {
      setIsDeleting(false);
    }
  };

  /* ---------- Reglas de validación ---------- */

  const nameRegister = register('name', {
    required: 'El nombre es obligatorio.',
    validate: (value) => value.trim().length > 0 || 'El nombre es obligatorio.'
  });

  // Al cambiar el inicio se vuelve a validar el fin, porque la duración depende de ambos.
  const startTimeRegister = register('startTime', {
    required: 'La hora de inicio es obligatoria.',
    deps: ['endTime']
  });

  const endTimeRegister = register('endTime', {
    required: 'La hora de fin es obligatoria.',
    validate: (value, formValues) => validateShiftTimes(formValues.startTime, value)
  });

  return (
    <>
      <ManagerPageHeader title="Turnos" subtitle="Horarios de trabajo del personal.">
        <Button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 !text-sm !font-semibold !normal-case"
        >
          <Plus size={18} aria-hidden="true" />
          Nuevo Turno
        </Button>
      </ManagerPageHeader>

      <div className="mt-6">
        <SearchBar
          value={search}
          onChange={handleSearchChange}
          placeholder="Buscar turno por nombre u horario..."
          ariaLabel="Buscar turno"
        />
      </div>

      <div className="mt-6">
        <ShiftTable
          rows={pageResult.pageItems}
          startIndex={pageResult.from === 0 ? 0 : pageResult.from - 1}
          isLoading={isLoading}
          error={loadError}
          emptyMessage={search ? 'No se encontraron turnos con esos criterios.' : 'Aún no hay turnos registrados.'}
          onRetry={() => void loadShifts()}
          onEdit={openEdit}
          onDelete={openDelete}
          pagination={{
            from: pageResult.from,
            to: pageResult.to,
            total: pageResult.total,
            itemLabel: 'turnos',
            currentPage: pageResult.currentPage,
            totalPages: pageResult.totalPages,
            onPageChange: setPage
          }}
        />
      </div>

      <ShiftFormModal
        isOpen={formState !== null}
        onClose={closeForm}
        onSubmit={handleFormSubmit}
        mode={formState?.mode ?? 'create'}
        nameRegister={nameRegister}
        startTimeRegister={startTimeRegister}
        endTimeRegister={endTimeRegister}
        startTime={startTime}
        endTime={endTime}
        errors={errors}
        serverError={serverError}
        isSubmitting={isSubmitting}
      />

      <ConfirmDeleteModal
        isOpen={deleteTarget !== null}
        onClose={closeDelete}
        onConfirm={() => void confirmDelete()}
        title="¿Eliminar turno?"
        description={
          deleteTarget ? (
            <>
              Está acción eliminará el turno <span className="text-[var(--text-h)]">{getShiftLabel(deleteTarget.name)}</span>{' '}
              ({formatShiftRange(deleteTarget.startTime, deleteTarget.endTime)}).
              <br />
              
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
