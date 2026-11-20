import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { AlertCircle, X } from 'lucide-react';
import { AppointmentDetailModal } from '../components/appointments/AppointmentDetailModalComponent';
import { AppointmentFilters, FilterToggleButton } from '../components/appointments/AppointmentFiltersComponent';
import { AppointmentTable } from '../components/appointments/AppointmentTableComponent';
import { ManagerPageHeader } from '../components/dashboard/ManagerPageHeaderComponent';
import { SearchBar } from '../components/common/SearchBarComponent';
import { Toast } from '../components/common/ToastComponent';
import { useAuth } from '../context/AuthContext';
import { checkInAppointment, getAppointments, type AppointmentQuery } from '../services/appointmentService';
import type { AppointmentFilterValues, AppointmentRecord, SortDirection } from '../types/appointmentType';
import type { UserRole } from '../components/appointments/EditAppointmentModalComponent';
import { CancelAppointmentContainer, EditAppointmentContainer } from './AppointmentActionsContainer';
import {
  MAX_RANGE_DAYS,
  STATUS_OPTIONS,
  buildServiceOptions,
  buildShopOptions,
  canCheckIn,
  collectServiceLabels,
  collectShopLabels,
  countActiveFilters,
  filterAppointments,
  getCheckInErrorMessage,
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
  const [editingAppointment, setEditingAppointment] = useState<AppointmentRecord | null>(null);
  const [cancelingAppointment, setCancelingAppointment] = useState<AppointmentRecord | null>(null);

  const [now, setNow] = useState(() => Date.now());
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [checkInError, setCheckInError] = useState('');
  const [modalCheckInError, setModalCheckInError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, []);

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
    (a.status === 'scheduled' || a.status === 'rescheduled') && new Date(a.scheduledStart).getTime() > now;

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
    // Un error de check-in previo deja de ser relevante cuando la lista se vuelve a consultar.
    setCheckInError('');

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

  /* Al cambiar cualquier filtro se vuelve a la primera página y se descarta el error de check-in. */
  useEffect(() => {
    const subscription = watch(() => {
      setPage(1);
      setCheckInError('');
    });
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
    setCheckInError('');
  };

  const handleToggleSort = () => {
    setSortDirection((current) => (current === 'desc' ? 'asc' : 'desc'));
    setPage(1);
  };

  const handleReset = () => {
    reset(getDefaultFilters());
    setSearch('');
    setPage(1);
    setCheckInError('');
  };

  const handleCheckIn = async (appointment: AppointmentRecord, source: 'table' | 'modal') => {
    if (!token || checkingInId !== null) return;

    setCheckingInId(appointment.id);
    setCheckInError('');
    setModalCheckInError('');

    try {
      const updated = await checkInAppointment(token, appointment.id);
      setSelectedAppointment((current) => (current?.id === updated.id ? updated : current));
      setToast({ message: `Check-in registrado para ${appointment.clientName}.`, type: 'success' });
      await loadAppointments();
    } catch (error) {
      const message = getCheckInErrorMessage(error);
      if (source === 'modal') {
        setModalCheckInError(message);
      } else {
        setCheckInError(message);
      }
    } finally {
      setCheckingInId(null);
    }
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
      <ManagerPageHeader title="Citas" subtitle="Consulta y gestión de citas, estados y registro de check-in." />

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

      {checkInError && (
        <div
          role="alert"
          className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[#ff4d4d]/40 bg-[#ff4d4d]/10 px-4 py-3 text-sm font-medium text-[#ffb3b3]"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="shrink-0 text-[#ff4d4d]" aria-hidden="true" />
            <span>{checkInError}</span>
          </div>
          <button
            type="button"
            onClick={() => setCheckInError('')}
            aria-label="Cerrar alerta"
            className="cursor-pointer rounded-md p-1 text-[#ffb3b3] transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      )}

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
            setModalCheckInError('');
            setSelectedAppointment(appointment);
          }}
          onCheckIn={(appointment) => void handleCheckIn(appointment, 'table')}
          canCheckInRow={(appointment) => canCheckIn(appointment, now)}
          checkingInId={checkingInId}
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
          if (checkingInId === selectedAppointment?.id) return;
          setModalCheckInError('');
          setSelectedAppointment(null);
        }}
        onCheckIn={
          selectedAppointment && canCheckIn(selectedAppointment, now)
            ? () => void handleCheckIn(selectedAppointment, 'modal')
            : undefined
        }
        isCheckingIn={selectedAppointment !== null && checkingInId === selectedAppointment.id}
        checkInError={modalCheckInError}
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

      <Toast message={toast?.message ?? null} type={toast?.type} onDismiss={dismissToast} />
    </>
  );
}
