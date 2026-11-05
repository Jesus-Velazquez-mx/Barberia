import type { FieldErrors, UseFormRegisterReturn } from 'react-hook-form';
import { FormModal } from '../common/FormModalComponent';
import { InputField } from '../common/InputFieldComponent';
import { SelectField, type SelectOption } from '../common/SelectFieldComponent';
import type { ShopFormValues } from '../../types/shopType';

interface ShopFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  mode: 'create' | 'edit';
  managerOptions: SelectOption[];
  nameRegister: UseFormRegisterReturn;
  streetRegister: UseFormRegisterReturn;
  numberRegister: UseFormRegisterReturn;
  postalCodeRegister: UseFormRegisterReturn;
  phoneRegister: UseFormRegisterReturn;
  managerRegister: UseFormRegisterReturn;
  errors: FieldErrors<ShopFormValues>;
  serverError: string;
  isSubmitting: boolean;
}

export function ShopFormModal({
  isOpen,
  onClose,
  onSubmit,
  mode,
  managerOptions,
  nameRegister,
  streetRegister,
  numberRegister,
  postalCodeRegister,
  phoneRegister,
  managerRegister,
  errors,
  serverError,
  isSubmitting
}: ShopFormModalProps) {
  const isEdit = mode === 'edit';

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title={isEdit ? 'Editar sucursal' : 'Registrar nueva sucursal'}
      description={isEdit ? 'Modifica la información de la sucursal.' : 'Ingresa los datos para dar de alta la sucursal.'}
      submitLabel={isEdit ? 'Actualizar Sucursal' : 'Guardar Sucursal'}
      loadingLabel={isEdit ? 'Actualizando...' : 'Guardando...'}
      serverError={serverError}
      isSubmitting={isSubmitting}
    >
      <InputField
        id="shopName"
        type="text"
        label="Nombre de la Sucursal *"
        placeholder="NERV Barbershop - Centro"
        autoComplete="off"
        error={errors.name?.message}
        registerProps={nameRegister}
      />

      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <InputField
          id="shopStreet"
          type="text"
          label="Calle"
          placeholder="Av. Revolución"
          autoComplete="off"
          error={errors.street?.message}
          registerProps={streetRegister}
        />

        <InputField
          id="shopNumber"
          type="text"
          label="Número"
          placeholder="1250"
          autoComplete="off"
          error={errors.number?.message}
          registerProps={numberRegister}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          id="shopPostalCode"
          type="text"
          label="Código Postal"
          placeholder="82000"
          autoComplete="off"
          error={errors.postalCode?.message}
          registerProps={postalCodeRegister}
        />

        <InputField
          id="shopPhone"
          type="tel"
          label="Teléfono"
          placeholder="669 123 4567"
          autoComplete="off"
          error={errors.phone?.message}
          registerProps={phoneRegister}
        />
      </div>

      <SelectField
        id="shopManager"
        label="Gerente *"
        options={[{ value: '', label: 'Selecciona un gerente' }, ...managerOptions]}
        error={errors.managerId?.message}
        registerProps={managerRegister}
      />
    </FormModal>
  );
}