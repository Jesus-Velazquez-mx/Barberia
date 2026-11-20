import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { AppointmentDetailModal } from '../components/appointments/AppointmentDetailModalComponent';
import { MarkNoShowModal } from '../components/appointments/MarkNoShowModalComponent';
import { AppointmentFilters, FilterToggleButton } from '../components/appointments/AppointmentFiltersComponent';
import { AppointmentTable } from '../components/appointments/AppointmentTableComponent';
import { ManagerPageHeader } from '../components/dashboard/ManagerPageHeaderComponent';
import { SearchBar } from '../components/common/SearchBarComponent';
import { useAuth } from '../context/AuthContext';
import {
  getAppointmentById,
  getAppointments,
  markAppointmentNoShow,
  type AppointmentQuery
} from '../services/appointmentService';
import type { AppointmentFilterValues, AppointmentRecord, SortDirection } from '../types/appointmentType';
import type { UserRole } from '../components/appointments/EditAppointmentModalComponent';
import { CancelAppointmentContainer, EditAppointmentContainer } from './AppointmentActionsContainer';
import {
  MAX_RANGE_DAYS,
  STATUS_OPTIONS,
  buildServiceOptions,
  buildShopOptions,
  collectServiceLabels,
  collectShopLabels,
  countActiveFilters,
  filterAppointments,
  getDefaultFilters,
  hasActiveFilters,
  mergeCatalog,
  shiftIsoDate,
  sortByServiceDate,
  toAppointmentQuery,
  type LabelCatalog
} from '../utils/appointmentUtils';
import { getApiErrorMessage } from '../utils/apiErrorUtils';
import { displayToIsoDate, isValidDisplayDate } from '../utils/dateFormat';
import { paginate } from '../utils/listUtils';

const INVALID_DATE_MESSAGE = 'Fecha no válida (dd/mm/aaaa).';
const RANGE_MESSAGE = 'No puede ser anterior a la fecha inicial.';
const RANGE_TOO_LONG_MESSAGE = 'El rango de fechas no puede exceder 1 año.';

/* Vista de citas para manager y recepcionista (misma pantalla para ambos roles). */
export function StaffAppointmentsContainer() {
  const { token, user } = useAuth();
  const role = user?.role;
  /* La recepcionista solo ve las citas de su sucursal, así que el filtro de sucursal es solo del manager. */
  const canFilterByShop = role === 'manager';

  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [shopCatalog, setShopCatalog] = useState<LabelCatalog>(new Map());
  const [serviceCatalog, setServiceCatalog] = useState<LabelCatalog>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  /* Identifica la consulta más reciente: una respuesta tardía de una consulta anterior se descarta. */
  const latestRequest = useRef(0);

  const [search, setSearch] = useState('');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentRecord | null>(null);
  const [noShowAppointment, setNoShowAppointment] = useState<AppointmentRecord | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<AppointmentRecord | null>(null);
  const [cancelingAppointment, setCancelingAppointment] = useState<AppointmentRecord | null>(null);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  const {
    register,
    watch,
    reset,
    getValues,
    formState: { errors }
  } = useForm<AppointmentFilterValues>({ defaultValues: getDefaultFilters(), mode: 'onChange' });

  /* Los filtros se aplican al instante, sin botón "Aplicar". */
  const filters = watch();
  /* El personal no tiene el límite de 8 horas: basta con que la cita siga agendada o reagendada y no haya empezado. */
  const canModify = (a: AppointmentRecord) =>
    (a.status === 'scheduled' || a.status === 'rescheduled') && new Date(a.scheduledStart).getTime() > Date.now();

  /* Fecha de servicio, sucursal y estado se piden al backend; null mientras una fecha está incompleta o
     el rango es inválido (en ese caso se conserva la última consulta válida). */
  const nextQuery = toAppointmentQuery(filters, canFilterByShop);
  const nextQueryKey = nextQuery ? JSON.stringify(nextQuery) : null;
  const [query, setQuery] = useState<AppointmentQuery>(
    () => toAppointmentQuery(getDefaultFilters(), canFilterByShop) ?? {}
  );

  useEffect(() => {
    // Si la consulta no cambió (p. ej. en el primer render) se conserva el objeto para no volver a consultar.
    if (nextQuery) setQuery((current) => (JSON.stringify(current) === nextQueryKey ? current : nextQuery));
    // nextQueryKey representa el contenido de nextQuery (el objeto cambia en cada render).
  }, [nextQueryKey]);

  const loadAppointments = useCallback(async () => {
    if (!token) return;

    const requestId = ++latestRequest.current;
    setIsLoading(true);
    setLoadError('');

    try {
      const data = await getAppointments(token, role, query);
      if (requestId !== latestRequest.current) return;

      setAppointments(data);
      setShopCatalog((current) => mergeCatalog(current, collectShopLabels(data)));
      setServiceCatalog((current) => mergeCatalog(current, collectServiceLabels(data)));
    } catch (error) {
      if (requestId !== latestRequest.current) return;
      setLoadError(getApiErrorMessage(error, 'No se pudieron cargar las citas. Intenta de nuevo.'));
    } finally {
      if (requestId === latestRequest.current) setIsLoading(false);
    }
  }, [token, role, query]);

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  useEffect(() => {
    if (!selectedAppointment || role !== 'receptionist') return;

    const noShowAt = Date.parse(selectedAppointment.scheduledStart);
    const remaining = noShowAt - currentTime;
    if (remaining <= 0) return;

    const timer = window.setTimeout(
      () => setCurrentTime(Date.now()),
      Math.min(remaining, 2_147_000_000)
    );
    return () => window.clearTimeout(timer);
  }, [currentTime, role, selectedAppointment?.id, selectedAppointment?.scheduledStart]);

  /* Al cambiar cualquier filtro se vuelve a la primera página. */
  useEffect(() => {
    const subscription = watch(() => setPage(1));
    return () => subscription.unsubscribe();
  }, [watch]);

  /* ---------- Lista: filtros, orden y paginación ---------- */

  const results = sortByServiceDate(filterAppointments(appointments, search, filters), sortDirection);
  const pageResult = paginate(results, page);
  const shopOptions = buildShopOptions(shopCatalog);
  const serviceOptions = buildServiceOptions(serviceCatalog);
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

  const handleMarkNoShow = async (appointmentId: string) => {
    if (!token) throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.');

    try {
      await markAppointmentNoShow(token, appointmentId);
      setNoShowAppointment(null);
      await loadAppointments();
    } catch (error) {
      const message = getApiErrorMessage(error, 'No se pudo marcar la cita como inasistencia.');
      try {
        const freshAppointment = await getAppointmentById(token, appointmentId);
        if (freshAppointment) setNoShowAppointment(freshAppointment);
      } catch {
        await loadAppointments();
      }
      throw new Error(message);
    }
  };

  const getNoShowDisabledReason = (appointment: AppointmentRecord): string | undefined => {
    if (appointment.status === 'noShow') return 'Esta cita ya está marcada como inasistencia.';
    if (appointment.isWalkIn) return 'Los walk-ins no se marcan como inasistencia.';
    if (appointment.status !== 'scheduled' && appointment.status !== 'rescheduled') {
      return 'Solo se pueden marcar citas agendadas o reagendadas.';
    }
    if (currentTime < Date.parse(appointment.scheduledStart)) return 'Se habilita a partir de la hora programada de inicio.';
    return undefined;
  };

  /* ---------- Reglas de validación de fechas ---------- */

  const dateRule = (value: string) => value === '' || isValidDisplayDate(value) || INVALID_DATE_MESSAGE;

  /* "Hasta" no puede ser anterior a "Desde" (solo se compara cuando ambas fechas son válidas). */
  const rangeRule = (fromKey: 'serviceFrom' | 'createdFrom') => (value: string) => {
    const from = displayToIsoDate(getValues(fromKey));
    const to = displayToIsoDate(value);
    return !from || !to || to >= from || RANGE_MESSAGE;
  };

  /* El backend limita la consulta por fecha de servicio a 366 días. */
  const serviceSpanRule = (value: string) => {
    const from = displayToIsoDate(getValues('serviceFrom'));
    const to = displayToIsoDate(value);
    return !from || !to || to <= shiftIsoDate(from, MAX_RANGE_DAYS - 1) || RANGE_TOO_LONG_MESSAGE;
  };

  const fields = {
    serviceFrom: register('serviceFrom', { validate: dateRule, deps: ['serviceTo'] }),
    serviceTo: register('serviceTo', {
      validate: { date: dateRule, range: rangeRule('serviceFrom'), span: serviceSpanRule }
    }),
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
          onSelect={(appointment) => {
            setCurrentTime(Date.now());
            setSelectedAppointment(appointment);
          }}
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

      <AppointmentDetailModal
        appointment={selectedAppointment}
        onClose={() => {
          setSelectedAppointment(null);
        }}
        onMarkNoShow={
          selectedAppointment && role === 'receptionist'
            ? () => {
              setNoShowAppointment(selectedAppointment);
              setSelectedAppointment(null);
            }
            : undefined
        }
        canMarkNoShow={
          selectedAppointment !== null &&
          role === 'receptionist' &&
          getNoShowDisabledReason(selectedAppointment) === undefined
        }
        noShowDisabledReason={selectedAppointment ? getNoShowDisabledReason(selectedAppointment) : undefined}
        onEdit={
          selectedAppointment && canModify(selectedAppointment)
            ? () => {
              // Se cierra el detalle antes de abrir la edición para no apilar dos modales.
              setEditingAppointment(selectedAppointment);
              setSelectedAppointment(null);
            }
            : undefined
        }
        onCancel={
          selectedAppointment && canModify(selectedAppointment)
            ? () => {
              setCancelingAppointment(selectedAppointment);
              setSelectedAppointment(null);
            }
            : undefined
        }
      />

      {editingAppointment && (
        <EditAppointmentContainer
          appointment={editingAppointment}
          role={role as UserRole}
          onDone={loadAppointments}
          onClose={() => setEditingAppointment(null)}
        />
      )}

      {cancelingAppointment && (
        <CancelAppointmentContainer
          appointment={cancelingAppointment}
          role={role as UserRole}
          onDone={loadAppointments}
          onClose={() => setCancelingAppointment(null)}
        />
      )}
      {noShowAppointment && (
        <MarkNoShowModal
          appointment={noShowAppointment}
          onConfirm={handleMarkNoShow}
          onBack={() => {
            setSelectedAppointment(noShowAppointment);
            setNoShowAppointment(null);
          }}
          onClose={() => setNoShowAppointment(null)}
        />
      )}
    </>
  );
}
