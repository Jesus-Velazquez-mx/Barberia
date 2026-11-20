import { Footprints } from 'lucide-react';

interface WalkInBadgeProps {
  compact?: boolean;
}

/* Distintivo para citas sin reserva previa (is_walk_in = true), cuyo check-in es automático. */
export function WalkInBadge({ compact = false }: WalkInBadgeProps) {
  return (
    <span
      title="Servicio sin cita previa (check-in automático al llegar su hora)"
      className={
        compact
          ? 'inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-[#9B7EDE]/55 bg-[#9B7EDE]/20 px-2 py-0.5 text-[0.65rem] font-semibold uppercase text-[#C9B6F2]'
          : 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[#9B7EDE]/55 bg-[#9B7EDE]/15 px-3 py-1 text-xs font-semibold text-[#C9B6F2]'
      }
    >
      <Footprints size={compact ? 11 : 12} aria-hidden="true" />
      Walk-in
    </span>
  );
}
