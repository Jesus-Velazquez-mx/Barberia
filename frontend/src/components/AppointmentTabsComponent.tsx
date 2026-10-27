import { CalendarDays, History, XCircle } from 'lucide-react';
import type { ComponentType } from 'react';

export type AppointmentTab = 'upcoming' | 'past' | 'cancelled';

interface TabDef {
  value: AppointmentTab;
  label: string;
  Icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean }>;
}

const TABS: TabDef[] = [
  { value: 'upcoming', label: 'Próximas citas', Icon: CalendarDays },
  { value: 'past', label: 'Citas pasadas', Icon: History },
  { value: 'cancelled', label: 'Citas canceladas', Icon: XCircle }
];

interface AppointmentTabsProps {
  value: AppointmentTab;
  counts: Record<AppointmentTab, number>;
  onChange: (tab: AppointmentTab) => void;
}

export function AppointmentTabs({ value, counts, onChange }: AppointmentTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Filtrar citas"
      className="inline-flex max-w-full overflow-x-auto rounded-full border border-white/10 bg-[#1A1A1A]"
    >
      {TABS.map(({ value: tab, label, Icon }, index) => {
        const isActive = tab === value;

        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab)}
            className={`inline-flex cursor-pointer items-center gap-2.5 whitespace-nowrap border-none px-6 py-3 text-sm font-semibold transition-colors ${
              index > 0 && !isActive ? 'border-l border-white/10' : ''
            } ${
              isActive
                ? 'rounded-full bg-[var(--accent)] text-[#111]'
                : 'bg-transparent text-[var(--text)] hover:text-[var(--text-h)]'
            }`}
          >
            <Icon size={18} aria-hidden={true} />
            {label}
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                isActive ? 'bg-black/30 text-[var(--text-h)]' : 'bg-[#2C2C2C] text-[var(--text-h)]'
              }`}
            >
              {counts[tab]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
