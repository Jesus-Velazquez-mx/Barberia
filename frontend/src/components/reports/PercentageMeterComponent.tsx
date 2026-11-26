interface PercentageMeterProps {
  /* 0 a 100. */
  value: number;
}

/* Barra de avance. Es decorativa: el porcentaje siempre se muestra como texto junto a ella. */
export function PercentageMeter({ value }: PercentageMeterProps) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--accent)]/20" aria-hidden="true">
      <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${value}%` }} />
    </div>
  );
}
