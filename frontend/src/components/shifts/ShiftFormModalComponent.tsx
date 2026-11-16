import type { FieldErrors, UseFormRegisterReturn } from 'react-hook-form';
import { FormModal } from '../common/FormModalComponent';
import { InputField } from '../common/InputFieldComponent';
import { formatShiftDuration, getShiftDurationMinutes, validateShiftTimes } from '../../utils/shiftUtils';
import type { ShiftFormValues } from '../../types/shiftType';

interface ShiftFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  mode: 'create' | 'edit';
  nameRegister: UseFormRegisterReturn;
  startTimeRegister: UseFormRegisterReturn;
  endTimeRegister: UseFormRegisterReturn;
  /* Valores actuales (watch) para mostrar la duración mientras se escribe. */
  startTime: string;
  endTime: string;
  errors: FieldErrors<ShiftFormValues>;
  serverError: string;
  isSubmitting: boolean;
}

export function ShiftFormModal({
  isOpen,
  onClose,
  onSubmit,
  mode,
  nameRegister,
  startTimeRegister,
  endTimeRegister,
  startTime,
  endTime,
  errors,
  serverError,
  isSubmitting
}: ShiftFormModalProps) {
  const isEdit = mode === 'edit';
  const timesAreValid = startTime !== '' && endTime !== '' && validateShiftTimes(startTime, endTime) === true;

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title={isEdit ? 'Editar turno' : 'Registrar nuevo turno'}
      description={`Los turnos no pueden cruzar la medianoche.`}
      submitLabel={isEdit ? 'Actualizar Turno' : 'Guardar Turno'}
      loadingLabel={isEdit ? 'Actualizando...' : 'Guardando...'}
      serverError={serverError}
      isSubmitting={isSubmitting}
    >
      <InputField
        id="shiftName"
        type="text"
        label="Nombre del Turno *"
        placeholder="Matutino"
        autoComplete="off"
        error={errors.name?.message}
        registerProps={nameRegister}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          id="shiftStartTime"
          type="time"
          label="Hora de inicio *"
          error={errors.startTime?.message}
          registerProps={startTimeRegister}
        />

        <InputField
          id="shiftEndTime"
          type="time"
          label="Hora de fin *"
          error={errors.endTime?.message}
          registerProps={endTimeRegister}
        />
      </div>

      {timesAreValid && (
        <p className="m-0 rounded-lg border border-white/10 bg-black/20 px-3.5 py-2.5 text-sm text-[var(--text)]">
          Duración del turno:{' '}
          <span className="font-semibold text-[var(--accent)]">
            {formatShiftDuration(getShiftDurationMinutes(startTime, endTime))}
          </span>
        </p>
      )}
    </FormModal>
  );
}