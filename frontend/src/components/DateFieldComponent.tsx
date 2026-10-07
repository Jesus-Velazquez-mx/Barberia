import { useRef } from 'react';
import { Calendar } from 'lucide-react';
import type { ChangeHandler, UseFormRegisterReturn } from 'react-hook-form';
import { InputField } from './InputFieldComponent';
import { displayToIsoDate, isoToDisplayDate, maskDisplayDate } from '../utils/dateFormat';

interface DateFieldProps {
  id: string;
  label: string;
  /** Fecha mínima del calendario, formato YYYY-MM-DD */
  min: string;
  /** Fecha máxima del calendario, formato YYYY-MM-DD */
  max?: string;
  error?: string;
  /** El valor del formulario para este campo es texto dd/mm/aaaa (ver utils/dateFormat) */
  registerProps: UseFormRegisterReturn;
}

/* El <input type="date"> nativo muestra el formato del navegador (mm/dd/aaaa en en-US) y no se
   puede forzar. Se usa un input de texto con máscara dd/mm/aaaa, y el calendario nativo queda
   oculto detrás de un botón solo para elegir la fecha. */
export function DateField({ id, label, min, max, error, registerProps }: DateFieldProps) {
  const textRef = useRef<HTMLInputElement | null>(null);
  const pickerRef = useRef<HTMLInputElement | null>(null);

  const setTextRef = (element: HTMLInputElement | null) => {
    textRef.current = element;
    registerProps.ref(element);
  };

  const handleTextChange: ChangeHandler = (event) => {
    event.target.value = maskDisplayDate(event.target.value);
    return registerProps.onChange(event);
  };

  const openPicker = () => {
    const picker = pickerRef.current;
    if (!picker) return;

    // Abre el calendario en la fecha que ya está escrita (si es válida)
    picker.value = displayToIsoDate(textRef.current?.value ?? '');
    try {
      picker.showPicker();
    } catch {
      textRef.current?.focus();
    }
  };

  const handlePickerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const text = textRef.current;
    if (!text) return;

    text.value = isoToDisplayDate(event.target.value);
    void registerProps.onChange({ target: text, type: 'change' });
  };

  return (
    <InputField
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder="dd/mm/aaaa"
      maxLength={10}
      label={label}
      error={error}
      registerProps={{ ...registerProps, ref: setTextRef, onChange: handleTextChange }}
      trailing={
        <>
          <button
            type="button"
            onClick={openPicker}
            aria-label="Abrir calendario"
            className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center border-none bg-transparent p-0 text-[#a0a0a0] hover:text-white cursor-pointer"
          >
            <Calendar size={18} />
          </button>
          <input
            ref={pickerRef}
            type="date"
            min={min}
            max={max}
            tabIndex={-1}
            aria-hidden="true"
            onChange={handlePickerChange}
            className="pointer-events-none absolute right-0 top-full h-0 w-0 opacity-0"
          />
        </>
      }
    />
  );
}
