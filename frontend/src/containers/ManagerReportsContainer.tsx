import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ManagerPageHeader } from '../components/dashboard/ManagerPageHeaderComponent';
import { ReportAlert } from '../components/reports/ReportAlertComponent';
import { ReportChart } from '../components/reports/ReportChartComponent';
import { ReportForm } from '../components/reports/ReportFormComponent';
import { ReportSummary } from '../components/reports/ReportSummaryComponent';
import { ReportTable } from '../components/reports/ReportTableComponent';
import { useAuth } from '../context/AuthContext';
import { getBarberPerformanceReport } from '../services/reportService';
import { getShops } from '../services/shopService';
import type { BarberPerformanceReport, ReportFormValues } from '../types/reportType';
import type { Shop } from '../types/shop';
import { paginate } from '../utils/listUtils';
import {
  getDefaultReportValues,
  getReportErrorMessage,
  toReportQuery,
  validateReportDate,
  validateReportRange
} from '../utils/reportUtils';

export function ManagerReportsContainer() {
  const { token } = useAuth();

  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoadingShops, setIsLoadingShops] = useState(true);
  const [shopsError, setShopsError] = useState('');

  const [report, setReport] = useState<BarberPerformanceReport | null>(null);
  const [reportError, setReportError] = useState('');
  const [page, setPage] = useState(1);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<ReportFormValues>({ defaultValues: getDefaultReportValues() });

  /* ---------- Sucursales a cargo del manager (incluye inactivas: conservan su historial) ---------- */

  const loadShops = useCallback(async () => {
    if (!token) return;

    setIsLoadingShops(true);
    setShopsError('');

    try {
      setShops(await getShops(token, true));
    } catch {
      setShopsError('No se pudieron cargar las sucursales. Intenta de nuevo.');
    } finally {
      setIsLoadingShops(false);
    }
  }, [token]);

  useEffect(() => {
    void loadShops();
  }, [loadShops]);

  // Con una sola sucursal no hay nada que elegir. Va en un efecto para que la opción ya exista en el <select>.
  useEffect(() => {
    if (shops.length === 1) setValue('shopId', shops[0].id);
  }, [shops, setValue]);

  const shopOptions = useMemo(
    () => [
      { value: '', label: isLoadingShops ? 'Cargando sucursales...' : 'Selecciona una sucursal' },
      ...shops.map((shop) => ({
        value: shop.id,
        label: shop.isActive ? shop.name : `${shop.name} (inactiva)`
      }))
    ],
    [shops, isLoadingShops]
  );

  /* ---------- Generación del reporte ---------- */

  // Se descarta el resultado anterior para no mostrar cifras o avisos que no corresponden a los datos enviados.
  const clearResult = () => {
    setReport(null);
    setReportError('');
    setPage(1);
  };

  const onSubmit = async (values: ReportFormValues) => {
    clearResult();

    if (!token) {
      setReportError('Tu sesión expiró. Inicia sesión de nuevo.');
      return;
    }

    try {
      setReport(await getBarberPerformanceReport(toReportQuery(values), token));
    } catch (error) {
      setReportError(getReportErrorMessage(error));
    }
  };

  const submitReport = (event?: React.FormEvent<HTMLFormElement>) => {
    void handleSubmit(onSubmit, clearResult)(event);
  };

  const pageResult = paginate(report?.barbers ?? [], page);

  /* ---------- Reglas de validación ---------- */

  const fields = {
    firstName: register('firstName'),
    lastName: register('lastName'),
    shopId: register('shopId', { required: 'Selecciona la sucursal a evaluar.' }),
    // Al cambiar el inicio se vuelve a validar el fin, porque el rango depende de ambos.
    startDate: register('startDate', {
      required: 'La fecha de inicio es obligatoria.',
      validate: validateReportDate,
      deps: ['endDate']
    }),
    endDate: register('endDate', {
      required: 'La fecha de fin es obligatoria.',
      validate: {
        date: validateReportDate,
        range: (value: string) => validateReportRange(getValues('startDate'), value)
      }
    })
  };

  const hasNoShops = !isLoadingShops && !shopsError && shops.length === 0;

  return (
    <>
      <ManagerPageHeader title="Reportes" subtitle="Desempeño de los barberos de tus sucursales." />

      <div className="mt-6">
        <ReportForm
          onSubmit={submitReport}
          fields={fields}
          errors={errors}
          shopOptions={shopOptions}
          isDisabled={shops.length === 0}
          isSubmitting={isSubmitting}
        />
      </div>

      <div className="mt-6 flex flex-col gap-6" aria-live="polite">
        {shopsError && <ReportAlert message={shopsError} onRetry={() => void loadShops()} />}
        {hasNoShops && <ReportAlert message="No tienes sucursales a tu cargo para generar reportes." />}
        {reportError && <ReportAlert message={reportError} />}

        {report && <ReportSummary report={report} />}

        {/* Se vuelve a montar con cada reporte, para no conservar la vista elegida en el anterior. */}
        {report && <ReportChart totals={report.totals} barbers={report.barbers} />}

        {(report || isSubmitting) && (
          <ReportTable
            rows={pageResult.pageItems}
            startIndex={pageResult.from === 0 ? 0 : pageResult.from - 1}
            isLoading={isSubmitting}
            error=""
            emptyMessage="No hay barberos en este reporte."
            onRetry={() => submitReport()}
            pagination={{
              from: pageResult.from,
              to: pageResult.to,
              total: pageResult.total,
              itemLabel: 'barberos',
              currentPage: pageResult.currentPage,
              totalPages: pageResult.totalPages,
              onPageChange: setPage
            }}
          />
        )}

        {!report && !reportError && !isSubmitting && !shopsError && !hasNoShops && (
          <div className="rounded-xl border border-dashed border-white/15 bg-[#1A1A1A] px-6 py-14 text-center">
            <p className="text-base font-semibold text-[var(--text-h)]">Aún no has generado un reporte.</p>
            <p className="mt-2 text-sm text-[var(--text)]">
              Elige la sucursal y el rango de fechas, y presiona &quot;Generar reporte&quot;.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
