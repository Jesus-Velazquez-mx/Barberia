import type { UseFormRegisterReturn } from 'react-hook-form';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  id: string;
  label: string;
  options: SelectOption[];
  error?: string;
  registerProps: UseFormRegisterReturn;
}

export function SelectField({ id, label, options, error, registerProps }: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[0.85rem] font-semibold text-[var(--labels)]">
        {label}
      </label>

      <div className="relative">
        <select
          id={id}
          className="w-full appearance-none rounded-lg border border-white/10 bg-black/20 px-3.5 py-2.5 pr-9 text-[var(--text-h)] outline-none focus:border-[var(--accent)]"
          aria-invalid={Boolean(error)}
          {...registerProps}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
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
        <p className="text-[0.8rem] text-[#ff4d4d]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
