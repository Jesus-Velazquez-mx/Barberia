import type { FieldErrors, UseFormRegisterReturn } from 'react-hook-form';
import { FormModal } from '../common/FormModalComponent';
import { InputField } from '../common/InputFieldComponent';
import { SelectField, type SelectOption } from '../common/SelectFieldComponent';
import type { SupplyFormValues } from '../../types/supplyType';

interface SupplyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  mode: 'create' | 'edit';
  shopOptions: SelectOption[];
  categoryOptions: SelectOption[];
  nameRegister: UseFormRegisterReturn;
  shopRegister: UseFormRegisterReturn;
  categoryRegister: UseFormRegisterReturn;
  unitRegister: UseFormRegisterReturn;
  skuRegister: UseFormRegisterReturn;
  descriptionRegister: UseFormRegisterReturn;
  errors: FieldErrors<SupplyFormValues>;
  serverError: string;
  isSubmitting: boolean;
}

export function SupplyFormModal({
  isOpen,
  onClose,
  onSubmit,
  mode,
  shopOptions,
  categoryOptions,
  nameRegister,
  shopRegister,
  categoryRegister,
  unitRegister,
  skuRegister,
  descriptionRegister,
  errors,
  serverError,
  isSubmitting
}: SupplyFormModalProps) {
  const isEdit = mode === 'edit';

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title={isEdit ? 'Editar suministro' : 'Registrar nuevo suministro'}
      description={isEdit ? 'Modifica la información del suministro.' : 'Ingresa los datos del nuevo suministro.'}
      submitLabel={isEdit ? 'Actualizar Suministro' : 'Guardar Suministro'}
      loadingLabel={isEdit ? 'Actualizando...' : 'Guardando...'}
      serverError={serverError}
      isSubmitting={isSubmitting}
    >
      <InputField
        id="supplyName"
        type="text"
        label="Nombre *"
        placeholder="Shampoo NERV"
        autoComplete="off"
        error={errors.name?.message}
        registerProps={nameRegister}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          id="supplyShop"
          label="Sucursal *"
          options={[{ value: '', label: 'Selecciona una sucursal' }, ...shopOptions]}
          error={errors.shopId?.message}
          registerProps={shopRegister}
        />

        <SelectField
          id="supplyCategory"
          label="Categoría *"
          options={[{ value: '', label: 'Selecciona una categoría' }, ...categoryOptions]}
          error={errors.categoryId?.message}
          registerProps={categoryRegister}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          id="supplyUnit"
          type="text"
          label="Unidad de medida *"
          placeholder="pieza, botella, caja"
          autoComplete="off"
          error={errors.unit?.message}
          registerProps={unitRegister}
        />

        <InputField
          id="supplySku"
          type="text"
          label="SKU"
          placeholder="TS-SHM-001"
          autoComplete="off"
          error={errors.sku?.message}
          registerProps={skuRegister}
        />
      </div>

      <InputField
        id="supplyDescription"
        type="text"
        label="Descripción"
        placeholder="Detalle opcional del suministro"
        autoComplete="off"
        error={errors.description?.message}
        registerProps={descriptionRegister}
      />
    </FormModal>
  );
}
