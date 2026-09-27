import { useState } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import eyeOpenIcon from '../assets/icons/show.png';
import eyeClosedIcon from '../assets/icons/hide.png';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  registerProps: UseFormRegisterReturn;
}

const BASE_INPUT_CLASSES =
  'w-full box-border rounded-lg border bg-[#121212] p-[10px] text-[13px] font-semibold text-white placeholder:text-[#a0a0a0] focus:outline-none';

export function InputField({ label, error, registerProps, id, type, ...rest }: InputFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const borderClasses = error
    ? 'border-[#ff4d4d] focus:border-[#ff4d4d] focus:shadow-[0_0_0_2px_rgba(255,77,77,0.2)]'
    : 'border-[#333333] focus:border-[var(--accent)]';

  return (
    <div className="flex w-full flex-col items-start gap-2">
      <label htmlFor={id} className="w-full text-left text-[0.9rem] font-semibold text-[var(--labels)]">
        {label}
      </label>

      <div className="relative w-full">
        <input
          id={id}
          type={inputType}
          className={`${BASE_INPUT_CLASSES} ${borderClasses} ${isPassword ? 'pr-10' : ''}`}
          {...registerProps}
          {...rest}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-[10px] top-1/2 flex -translate-y-1/2 items-center border-none bg-transparent p-0 cursor-pointer"
            tabIndex={-1}
          >
            <img
              src={showPassword ? eyeClosedIcon : eyeOpenIcon}
              alt={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="h-5 w-5"
            />
          </button>
        )}
      </div>

      {error && <span className="self-start text-[0.8rem] font-medium text-[#ff4d4d]">{error}</span>}
    </div>
  );
}