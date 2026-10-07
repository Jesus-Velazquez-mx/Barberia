import type { UseFormRegisterReturn } from 'react-hook-form';
import { InputField } from './InputFieldComponent';

interface DateFieldProps {
  id: string;
  label: string;
  /** Fecha mínima seleccionable, formato YYYY-MM-DD */
  min: string;
  /** Fecha máxima seleccionable, formato YYYY-MM-DD */
  max?: string;
  error?: string;
  registerProps: UseFormRegisterReturn;
}

/* Wrapper delgado sobre InputField: así hereda el mismo estilo que los demás campos. */
export function DateField({ id, label, min, max, error, registerProps }: DateFieldProps) {
  return (
    <InputField id={id} type="date" label={label} min={min} max={max} error={error} registerProps={registerProps} />
  );
}
