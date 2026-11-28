import type { FacialStructure } from '../../types/haircutStyleType';
import { getFacialStructureLabel } from '../../utils/haircutStyleUtils';

interface FacialStructureChipsProps {
  structures: FacialStructure[];
}

/* Estructuras faciales a las que aplica un estilo, como etiquetas. */
export function FacialStructureChips({ structures }: FacialStructureChipsProps) {
  if (structures.length === 0) return <span className="text-[var(--text)]">—</span>;

  return (
    <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
      {structures.map((structure) => (
        <li
          key={structure}
          className="whitespace-nowrap rounded-full border border-(--accent-border) bg-(--accent-bg) px-2.5 py-0.5 text-xs font-semibold text-(--accent)"
        >
          {getFacialStructureLabel(structure)}
        </li>
      ))}
    </ul>
  );
}
