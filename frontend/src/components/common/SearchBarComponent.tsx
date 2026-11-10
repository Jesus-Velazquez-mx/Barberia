import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
}

export function SearchBar({ value, onChange, placeholder, ariaLabel }: SearchBarProps) {
  return (
    <div className="relative">
      <Search
        size={18}
        className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-h)]"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="h-12 w-full rounded-full border border-transparent bg-[#2E2E2E] pl-12 pr-5 text-sm text-[var(--text-h)] placeholder:text-[#8A8A8A] focus:border-[var(--accent)] focus:outline-none"
      />
    </div>
  );
}
