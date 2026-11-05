import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import type { AppointmentFilterValues, AppointmentRecord, SortDirection } from '../types/appointmentType';
import { AppointmentTabs, type AppointmentTab } from '../components/appointments/AppointmentTabsComponent';
import { useAuth } from '../context/AuthContext';
import { AppointmentFilters, FilterToggleButton } from '../components/appointments/AppointmentFiltersComponent';
import { AppointmentTable } from '../components/appointments/AppointmentTableComponent';
import { CLIENT_APPOINTMENTS_PATH } from './ClientAppointmentDetailContainer';
import { getMyAppointments } from '../services/appointmentService';

const PAGE_SIZE = 8;

function classify(appointment: AppointmentRecord, now: number): AppointmentTab {
  if (appointment.status === 'cancelled') return 'cancelled';
  if (appointment.status === 'completed' || appointment.status === 'noShow') return 'past';
  // scheduled / rescheduled / checkedIn: pasan a "pasadas" cuando ya terminó su horario.
  return new Date(appointment.scheduledEnd).getTime() < now ? 'past' : 'upcoming';
}

const DEFAULT_FILTERS: AppointmentFilterValues = {
  serviceFrom: '',
  serviceTo: '',
  createdFrom: '',
  createdTo: '',
  shopId: 'all',
  serviceId: 'all',
  status: 'all'
};

/* dd/mm/aaaa -> timestamp local (null si está vacía o incompleta). */
function parseDate(text: string, endOfDay = false): number | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text.trim());
  if (!match) return null;
  const [, day, month, year] = match.map(Number);
  const date = endOfDay ? new Date(year, month - 1, day, 23, 59, 59, 999) : new Date(year, month - 1, day);
  return date.getMonth() === month - 1 ? date.getTime() : null;
}

function matchesFilters(a: AppointmentRecord, f: AppointmentFilterValues): boolean {
  const start = new Date(a.scheduledStart).getTime();
  const created = new Date(a.createdAt).getTime();

  const serviceFrom = parseDate(f.serviceFrom);
  const serviceTo = parseDate(f.serviceTo, true);
  const createdFrom = parseDate(f.createdFrom);
  const createdTo = parseDate(f.createdTo, true);

  if (serviceFrom !== null && start < serviceFrom) return false;
  if (serviceTo !== null && start > serviceTo) return false;
  if (createdFrom !== null && created < createdFrom) return false;
  if (createdTo !== null && created > createdTo) return false;
  if (f.shopId !== 'all' && a.shopId !== f.shopId) return false;
  if (f.serviceId !== 'all' && !a.services.some((s) => s.serviceId === f.serviceId)) return false;
  if (f.status !== 'all' && a.status !== f.status) return false;
  return true;
}

export function ClientAppointmentsContainer() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<AppointmentTab>('upcoming');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  /* ---------- Filtros ---------- */
  const {
    register,
    watch,
    reset,
    getValues,
    formState: { errors }
  } = useForm<AppointmentFilterValues>({ defaultValues: DEFAULT_FILTERS, mode: 'onChange' });

  const filters = watch();
  const filtersKey = JSON.stringify(filters);

  const dateRule = {
    validate: (value: string) => !value || parseDate(value) !== null || 'Usa el formato dd/mm/aaaa'
  };

  const rangeRule = (fromField: 'serviceFrom' | 'createdFrom') => ({
    validate: (value: string) => {
      if (!value) return true;
      const to = parseDate(value);
      if (to === null) return 'Usa el formato dd/mm/aaaa';
      const from = parseDate(getValues(fromField));
      return from === null || to >= from || 'Debe ser posterior a la fecha inicial';
    }
  });

  const fields = {
    serviceFrom: register('serviceFrom', dateRule),
    serviceTo: register('serviceTo', rangeRule('serviceFrom')),
    createdFrom: register('createdFrom', dateRule),
    createdTo: register('createdTo', rangeRule('createdFrom')),
    shopId: register('shopId'),
    serviceId: register('serviceId')
  };

  const activeCount = (Object.keys(DEFAULT_FILTERS) as (keyof AppointmentFilterValues)[]).filter(
    (key) => filters[key] !== DEFAULT_FILTERS[key]
  ).length;

  const serviceOptions = useMemo(() => {
    const unique = new Map<string, string>();
    appointments.forEach((a) => a.services.forEach((s) => unique.set(s.serviceId, s.name)));
    return [{ value: 'all', label: 'Todos los servicios' }, ...[...unique].map(([value, label]) => ({ value, label }))];
  }, [appointments]);

  // Al cambiar un filtro, vuelve a la primera página.
  useEffect(() => {
    setPage(1);
  }, [filtersKey]);

  /* ---------- Carga (backend) ---------- */
  const load = async () => {
    if (!user || !token) return;

    setIsLoading(true);
    setError('');
    try {
      // El backend devuelve solo las citas del cliente autenticado.
      const data = await getMyAppointments(token, {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email
      });
      setAppointments(data);
    } catch {
      setError('No se pudieron cargar tus citas.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [user?.id, token]);

  /* ---------- Agrupar, filtrar y ordenar ---------- */
  const { counts, rows } = useMemo(() => {
    const now = Date.now();
    const currentFilters = getValues();
    const groups: Record<AppointmentTab, AppointmentRecord[]> = { upcoming: [], past: [], cancelled: [] };
    appointments.filter((a) => matchesFilters(a, currentFilters)).forEach((a) => groups[classify(a, now)].push(a));

    const direction = sortDirection === 'asc' ? 1 : -1;
    const sorted = [...groups[tab]].sort(
      (a, b) => direction * (new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime())
    );

    return {
      counts: {
        upcoming: groups.upcoming.length,
        past: groups.past.length,
        cancelled: groups.cancelled.length
      },
      rows: sorted
    };
  }, [appointments, tab, sortDirection, filtersKey]);

  const handleTabChange = (next: AppointmentTab) => {
    setTab(next);
    setPage(1);
    // Próximas: la más cercana primero. Pasadas y canceladas: la más reciente primero.
    setSortDirection(next === 'upcoming' ? 'asc' : 'desc');
  };

  /* ---------- Paginación ---------- */
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const pageRows = rows.slice(startIndex, startIndex + PAGE_SIZE);
  const from = rows.length === 0 ? 0 : startIndex + 1;
  const to = startIndex + pageRows.length;

  const emptyMessages: Record<AppointmentTab, string> = {
    upcoming: 'No tienes citas próximas.',
    past: 'Aún no tienes citas pasadas.',
    cancelled: 'No tienes citas canceladas.'
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AppointmentTabs value={tab} counts={counts} onChange={handleTabChange} />
        <FilterToggleButton
          isOpen={isFiltersOpen}
          activeCount={activeCount}
          onClick={() => setIsFiltersOpen((open) => !open)}
        />
      </div>

      <AppointmentFilters
        isOpen={isFiltersOpen}
        fields={fields}
        errors={errors}
        serviceOptions={serviceOptions}
        canReset={activeCount > 0}
        onReset={() => reset(DEFAULT_FILTERS)}
      />

      <AppointmentTable
        rows={pageRows}
        startIndex={startIndex}
        isLoading={isLoading}
        error={error}
        emptyMessage={activeCount > 0 ? 'No hay citas que coincidan con los filtros.' : emptyMessages[tab]}
        onRetry={load}
        onSelect={(appointment) => navigate(`${CLIENT_APPOINTMENTS_PATH}/${appointment.id}`)}
        sortDirection={sortDirection}
        onToggleSort={() => setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))}
        showClientColumn={false}
        pagination={{
          from,
          to,
          total: rows.length,
          itemLabel: 'citas',
          currentPage: safePage,
          totalPages,
          onPageChange: setPage
        }}
      />
    </div>
  );
}
