import { ApiError } from '../types/api';
import type { BarberPerformanceQuery, ReportFormValues } from '../types/reportType';
import { displayToIsoDate, getTodayIso, isValidDisplayDate, isoToDisplayDate } from './dateFormat';

/* Mismo texto que devuelve el backend para un rango inválido. */
export const INVALID_RANGE_MESSAGE = 'El rango de fechas proporcionado no es válido.';

export const REPORT_NAME_MAX = 100;

/* Por defecto se evalúa el mes en curso, hasta hoy. */
export const getDefaultReportValues = (): ReportFormValues => {
    const today = getTodayIso();

    return {
        firstName: '',
        lastName: '',
        shopId: '',
        startDate: isoToDisplayDate(`${today.slice(0, 8)}01`),
        endDate: isoToDisplayDate(today)
    };
};

/* Reglas de react-hook-form: true si es válido o el mensaje de error. */
export const validateReportDate = (value: string): true | string =>
    isValidDisplayDate(value) || 'Fecha no válida (dd/mm/aaaa).';

/* Solo compara cuando ambas fechas son válidas; una fecha mal escrita ya muestra su propio error. */
export const validateReportRange = (startDate: string, endDate: string): true | string => {
    const start = displayToIsoDate(startDate);
    const end = displayToIsoDate(endDate);
    return !start || !end || start <= end || INVALID_RANGE_MESSAGE;
};

export const toReportQuery = (values: ReportFormValues): BarberPerformanceQuery => ({
    shopId: values.shopId,
    startDate: displayToIsoDate(values.startDate),
    endDate: displayToIsoDate(values.endDate),
    firstName: values.firstName.trim() || undefined,
    lastName: values.lastName.trim() || undefined
});

/* 62.5 -> "62.5 %"; sin servicios agendados no hay porcentaje que mostrar. */
export const formatPercentage = (value: number | null): string => (value === null ? '—' : `${value} %`);

/* ---------- Gráfica del destino de los servicios ---------- */

export type ServiceOutcomeKey = 'completedServices' | 'pendingServices' | 'cancelledServices' | 'noShowServices';

/* Orden fijo de los segmentos. Son los tonos de las insignias de estado ajustados para distinguirse entre sí
   como relleno, también con daltonismo. Se validaron todos los pares (no solo los contiguos) porque un resultado en
   cero no se dibuja y junta a los demás; al cambiar un color hay que volver a validar el conjunto. */
export const SERVICE_OUTCOMES: { key: ServiceOutcomeKey; label: string; color: string }[] = [
    { key: 'completedServices', label: 'Finalizados', color: '#5FA777' },
    { key: 'pendingServices', label: 'Pendientes', color: '#4A8FD0' },
    { key: 'cancelledServices', label: 'Cancelados', color: '#B0407A' },
    { key: 'noShowServices', label: 'Inasistencias', color: '#C98500' }
];

/* Parte de un total como porcentaje con un decimal, igual que el porcentaje que calcula el backend. */
export const formatShare = (value: number, total: number): string =>
    formatPercentage(total === 0 ? null : Math.round((value / total) * 1000) / 10);

/* Los mensajes de negocio del backend (400, 403, 404) ya vienen en español y se muestran tal cual. */
export const getReportErrorMessage = (error: unknown): string => {
    if (error instanceof ApiError) {
        if (error.status === 0) return 'No se pudo conectar con el servidor. Intenta de nuevo.';
        if (error.status < 500 && error.errors.length === 0) return error.message;
    }
    return 'No se pudo generar el reporte. Intenta de nuevo.';
};
