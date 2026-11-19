import { Eye } from 'lucide-react';

interface HaircutChipProps {
  name: string;
  /* Si es true la foto del corte está disponible: el chip muestra un ojo y se puede pulsar. */
  hasImage: boolean;
  /* Si es true la foto de este corte se está mostrando. */
  isSelected?: boolean;
  onSelect?: () => void;
}

const BASE_CLASS =
  'rounded-full border border-(--accent-border) bg-(--accent-bg) px-3 py-1 font-semibold text-(--accent)';

export function HaircutChip({ name, hasImage, isSelected = false, onSelect }: HaircutChipProps) {
  if (!hasImage) {
    return <li className={BASE_CLASS}>{name}</li>;
  }

  return (
    <li className="flex">
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={isSelected}
        aria-label={`Ver foto de ${name}`}
        className={`flex cursor-pointer items-center gap-2 font-[inherit] transition-colors hover:border-(--accent) ${BASE_CLASS} ${isSelected ? 'border-(--accent)' : ''}`}
      >
        <Eye size={16} aria-hidden="true" />
        {name}
      </button>
    </li>
  );
}
