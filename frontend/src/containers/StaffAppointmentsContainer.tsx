import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { AppointmentDetailModal } from '../components/AppointmentDetailModalComponent';
import { AppointmentFilters, FilterToggleButton } from '../components/AppointmentFiltersComponent';
import { AppointmentTable } from '../components/AppointmentTableComponent';
import { ManagerPageHeader } from '../components/ManagerPageHeaderComponent';
import { SearchBar } from '../components/SearchBarComponent';
import { useAuth } from '../context/AuthContext';
import { getAppointments } from '../services/appointmentService';
import type { AppointmentFilterValues, AppointmentRecord, SortDirection } from '../types/appointmentType';
import {
  STATUS_OPTIONS,
  buildServiceOptions,
  buildShopOptions,
  countActiveFilters,
  filterAppointments,
  getDefaultFilters,
  hasActiveFilters,
  sortByServiceDate
} from '../utils/appointmentUtils';
import { getApiErrorMessage } from '../utils/apiErrorUtils';
import { displayToIsoDate, isValidDisplayDate } from '../utils/dateFormat';
import { paginate } from '../utils/listUtils';

const INVALID_DATE_MESSAGE = 'Fecha no válida (dd/mm/aaaa).';
const RANGE_MESSAGE = 'No puede ser anterior a la fecha inicial.';

/* Vista de citas para manager y recepcionista (misma pantalla para ambos roles). */
export function StaffAppointmentsContainer() {
  const { token, user } = useAuth();
  const role = user?.role;
  /* La recepcionista solo ve las citas de su sucursal, así que el filtro de sucursal es solo del manager. */
  const canFilterByShop = role === 'manager';

  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [search, setSearch] = useState('');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentRecord | null>(null);

  const {
    register,
    watch,
    reset,
    getValues,
    formState: { errors }
  } = useForm<AppointmentFilterValues>({ defaultValues: getDefaultFilters(), mode: 'onChange' });

  /* Los filtros se aplican al instante, sin botón "Aplicar". */
  const filters = watch();

  const loadAppointments = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setLoadError('');

    try {
      setAppointments(await getAppointments(token, role));
    } catch (error) {
      setLoadError(getApiErrorMessage(error, 'No se pudieron cargar las citas. Intenta de nuevo.'));
    } finally {
      setIsLoading(false);
    }
  }, [token, role]);

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  /* Al cambiar cualquier filtro se vuelve a la primera página. */
  useEffect(() => {
    const subscription = watch(() => setPage(1));
    return () => subscription.unsubscribe();
  }, [watch]);

  /* ---------- Lista: filtros, orden y paginación ---------- */

  const results = sortByServiceDate(filterAppointments(appointments, search, filters), sortDirection);
  const pageResult = paginate(results, page);
  const shopOptions = buildShopOptions(appointments);
  const serviceOptions = buildServiceOptions(appointments);
  const isFiltered = hasActiveFilters(search, filters);
  const activeFilterCount = countActiveFilters(filters);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleToggleSort = () => {
    setSortDirection((current) => (current === 'desc' ? 'asc' : 'desc'));
    setPage(1);
  };

  const handleReset = () => {
    reset(getDefaultFilters());
    setSearch('');
    setPage(1);
  };

  /* ---------- Reglas de validación de fechas ---------- */

  const dateRule = (value: string) => value === '' || isValidDisplayDate(value) || INVALID_DATE_MESSAGE;

  /* "Hasta" no puede ser anterior a "Desde" (solo se compara cuando ambas fechas son válidas). */
  const rangeRule = (fromKey: 'serviceFrom' | 'createdFrom') => (value: string) => {
    const from = displayToIsoDate(getValues(fromKey));
    const to = displayToIsoDate(value);
    return !from || !to || to >= from || RANGE_MESSAGE;
  };

  const fields = {
    serviceFrom: register('serviceFrom', { validate: dateRule, deps: ['serviceTo'] }),
    serviceTo: register('serviceTo', { validate: { date: dateRule, range: rangeRule('serviceFrom') } }),
    createdFrom: register('createdFrom', { validate: dateRule, deps: ['createdTo'] }),
    createdTo: register('createdTo', { validate: { date: dateRule, range: rangeRule('createdFrom') } }),
    shopId: register('shopId'),
    serviceId: register('serviceId'),
    status: register('status')
  };

  return (
    <>
      <ManagerPageHeader title="Citas" subtitle="Consulta de citas agendadas, reagendadas y canceladas." />

      <div className="mt-6 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <SearchBar
            value={search}
            onChange={handleSearchChange}
            placeholder="Buscar por nombre o correo del cliente..."
            ariaLabel="Buscar cita por cliente"
          />
        </div>
        <FilterToggleButton
          isOpen={isFiltersOpen}
          activeCount={activeFilterCount}
          onClick={() => setIsFiltersOpen((open) => !open)}
        />
      </div>

      <div className={isFiltersOpen ? 'mt-4' : undefined}>
        <AppointmentFilters
          isOpen={isFiltersOpen}
          fields={fields}
          errors={errors}
          shopOptions={canFilterByShop ? shopOptions : undefined}
          serviceOptions={serviceOptions}
          statusOptions={STATUS_OPTIONS}
          canReset={isFiltered}
          onReset={handleReset}
        />
      </div>

      <div className="mt-6">
        <AppointmentTable
          rows={pageResult.pageItems}
          startIndex={pageResult.from === 0 ? 0 : pageResult.from - 1}
          isLoading={isLoading}
          error={loadError}
          emptyMessage={
            isFiltered ? 'No se encontraron citas con los filtros aplicados.' : 'No hay citas en este periodo.'
          }
          onRetry={() => void loadAppointments()}
          onSelect={setSelectedAppointment}
          sortDirection={sortDirection}
          onToggleSort={handleToggleSort}
          pagination={{
            from: pageResult.from,
            to: pageResult.to,
            total: pageResult.total,
            itemLabel: 'citas',
            currentPage: pageResult.currentPage,
            totalPages: pageResult.totalPages,
            onPageChange: setPage
          }}
        />
      </div>

      <AppointmentDetailModal appointment={selectedAppointment} onClose={() => setSelectedAppointment(null)} />
    </>
  );
}
