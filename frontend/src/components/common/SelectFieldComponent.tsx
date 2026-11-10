import type { UseFormRegisterReturn } from 'react-hook-form';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  id: string;
  label: string;
  options: SelectOption[];
  error?: string;
  disabled?: boolean;
  registerProps: UseFormRegisterReturn;
}

export function SelectField({ id, label, options, error, disabled, registerProps }: SelectFieldProps) {
  const borderClasses = error
    ? 'border-[#ff4d4d] focus:border-[#ff4d4d] focus:shadow-[0_0_0_2px_rgba(255,77,77,0.2)]'
    : 'border-[#333333] focus:border-[var(--accent)]';

  return (
    <div className="flex w-full flex-col gap-2">
      <label htmlFor={id} className="w-full text-left text-[0.9rem] font-semibold text-[var(--labels)]">
        {label}
      </label>

      <div className="relative w-full">
        <select
          id={id}
          className={`w-full box-border appearance-none rounded-lg border bg-[#121212] p-[10px] pr-9 text-[13px] text-[var(--text-h)] outline-none disabled:cursor-not-allowed disabled:opacity-60 ${borderClasses}`}
          aria-invalid={Boolean(error)}
          disabled={disabled}
          {...registerProps}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-[#1A1A1A] text-[var(--text-h)]">
              {option.label}
            </option>
          ))}
        </select>

        <svg
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text)]"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {error && (
        <span className="self-start text-[0.8rem] font-medium text-[#ff4d4d]" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
