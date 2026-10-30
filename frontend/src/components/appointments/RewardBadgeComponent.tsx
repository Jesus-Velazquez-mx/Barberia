import { Star } from 'lucide-react';

/* Distintivo de las citas canjeadas con recompensa (is_reward_redemption = true).
   Mismas medidas y borde que AppointmentStatusBadge para que ambos se alineen en el encabezado;
   la estrella lo distingue del badge dorado de "Reagendada". */
export function RewardBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[var(--accent)]/55 bg-[var(--accent)]/15 px-3 py-1 text-xs font-semibold text-[var(--accent)]">
      <Star size={12} fill="currentColor" aria-hidden="true" />
      Recompensa otorgada
    </span>
  );
}