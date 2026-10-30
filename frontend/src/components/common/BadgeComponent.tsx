interface BadgeProps {
  children: string;
}

export function Badge({ children }: BadgeProps) {
  return (
    <span className="inline-block whitespace-nowrap rounded-full bg-[#2C2C2C] px-3 py-1 text-xs font-semibold text-[var(--text-h)]">
      {children}
    </span>
  );
}
