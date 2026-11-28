import type { ChangeEvent } from 'react';
import type { FieldErrors, UseFormRegisterReturn } from 'react-hook-form';
import { FormModal } from '../common/FormModalComponent';
import { InputField } from '../common/InputFieldComponent';
import { SelectField } from '../common/SelectFieldComponent';
import { HaircutStyleThumbnail } from './HaircutStyleThumbnailComponent';
import type { FacialStructure, HaircutStyleFormValues } from '../../types/haircutStyleType';
import { ACTIVE_SELECT_OPTIONS } from '../../utils/offeredServiceUtils';
import { getFacialStructureLabel, HAIRCUT_IMAGE_ACCEPT } from '../../utils/haircutStyleUtils';

interface HaircutStyleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  mode: 'create' | 'edit';
  nameRegister: UseFormRegisterReturn;
  descriptionRegister: UseFormRegisterReturn;
  /* Un mismo register para todas las casillas: react-hook-form junta los valores marcados en un arreglo. */
  facialStructuresRegister: UseFormRegisterReturn;
  isActiveRegister: UseFormRegisterReturn;
  /* Estructuras faciales válidas (vienen de la BD). */
  facialStructureOptions: FacialStructure[];
  /* Foto que se mostrará: la nueva elegida o, si no hay, la actual del estilo. */
  photoPreviewUrl: string | null;
  hasNewPhoto: boolean;
  onPhotoChange: (file: File | null) => void;
  photoError: string;
  errors: FieldErrors<HaircutStyleFormValues>;
  serverError: string;
  isSubmitting: boolean;
}

const LABEL_CLASS = 'w-full text-left text-[0.9rem] font-semibold text-(--labels)';
const ERROR_CLASS = 'm-0 text-left text-[0.8rem] font-semibold text-[#ff4d4d]';

export function HaircutStyleFormModal({
  isOpen,
  onClose,
  onSubmit,
  mode,
  nameRegister,
  descriptionRegister,
  facialStructuresRegister,
  isActiveRegister,
  facialStructureOptions,
  photoPreviewUrl,
  hasNewPhoto,
  onPhotoChange,
  photoError,
  errors,
  serverError,
  isSubmitting
}: HaircutStyleFormModalProps) {
  const isEdit = mode === 'edit';
  const structuresError = errors.facialStructures?.message;

  const handlePhotoInput = (event: ChangeEvent<HTMLInputElement>) => {
    onPhotoChange(event.target.files?.[0] ?? null);
    // Permite volver a elegir el mismo archivo después de quitarlo
    event.target.value = '';
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title={isEdit ? 'Editar estilo de corte' : 'Registrar nuevo estilo'}
      description={isEdit ? 'Modifica la información del estilo.' : 'Ingresa los datos del nuevo estilo de corte.'}
      submitLabel={isEdit ? 'Actualizar Estilo' : 'Guardar Estilo'}
      loadingLabel={isEdit ? 'Actualizando...' : 'Guardando...'}
      serverError={serverError}
      isSubmitting={isSubmitting}
    >
      <InputField
        id="haircutStyleName"
        type="text"
        label="Nombre *"
        placeholder="Wolf Cut"
        autoComplete="off"
        error={errors.name?.message}
        registerProps={nameRegister}
      />

      <InputField
        id="haircutStyleDescription"
        type="text"
        label="Descripción"
        placeholder="Detalle opcional del estilo"
        autoComplete="off"
        error={errors.description?.message}
        registerProps={descriptionRegister}
      />

      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0" aria-describedby="haircutStyleStructuresError">
        <legend className={`${LABEL_CLASS} mb-2 p-0`}>Estructuras faciales *</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {facialStructureOptions.map((structure) => (
            <label
              key={structure}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#333333] bg-[#121212] px-3 py-2 text-[13px] font-semibold text-white has-[:checked]:border-(--accent)"
            >
              <input type="checkbox" value={structure} className="accent-(--accent)" {...facialStructuresRegister} />
              {getFacialStructureLabel(structure)}
            </label>
          ))}
        </div>
        {structuresError && (
          <p id="haircutStyleStructuresError" className={ERROR_CLASS} role="alert">
            {structuresError}
          </p>
        )}
      </fieldset>

      <div className="flex flex-col gap-2">
        <span className={LABEL_CLASS}>Fotografía</span>
        <div className="flex items-center gap-4">
          <HaircutStyleThumbnail name="seleccionado" url={photoPreviewUrl} size="lg" />
          <div className="flex flex-col items-start gap-2">
            <label
              htmlFor="haircutStylePhoto"
              className="cursor-pointer rounded-lg border border-[#333333] px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:border-(--accent)"
            >
              {photoPreviewUrl ? 'Cambiar foto' : 'Elegir foto'}
            </label>
            <input
              id="haircutStylePhoto"
              type="file"
              accept={HAIRCUT_IMAGE_ACCEPT}
              className="sr-only"
              onChange={handlePhotoInput}
            />
            {hasNewPhoto && (
              <button
                type="button"
                onClick={() => onPhotoChange(null)}
                className="cursor-pointer bg-transparent p-0 text-[0.8rem] font-semibold text-(--text) underline hover:text-(--text-h)"
              >
                Descartar foto nueva
              </button>
            )}
            <p className="m-0 text-[0.8rem] text-(--text)">Opcional. JPG, PNG o WEBP, máximo 5 MB.</p>
          </div>
        </div>
        {photoError && (
          <p className={ERROR_CLASS} role="alert">
            {photoError}
          </p>
        )}
      </div>

      {isEdit && (
        <SelectField
          id="haircutStyleStatus"
          label="Estado *"
          options={ACTIVE_SELECT_OPTIONS}
          error={errors.isActive?.message}
          registerProps={isActiveRegister}
        />
      )}
    </FormModal>
  );
}
