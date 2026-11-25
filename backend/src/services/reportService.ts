import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import { getBarberPerformance } from '../repositories/reportRepository.js';
import { getShopById, getShopIdsByManagerId } from '../repositories/shopRepository.js';
import { canGenerateReports, canGenerateShopReports } from './userPermissions.js';
import { getBusinessTimezone } from '../utils/businessTime.js';
import { dateOnlySchema } from '../utils/dateOnly.js';
import { toBarberPerformanceResponse, toPerformanceTotals } from '../utils/reportMapper.js';
import { isUserSessionValid } from '../utils/userSession.js';
import type { BarberPerformance } from '../types/entities/barberPerformance.interface.js';
import type { BarberPerformanceReportRequest } from '../types/dto/reportRequest.interface.js';
import type { BarberPerformanceReportResponse } from '../types/dto/reportResponse.interface.js';

// Textos definidos por el caso de uso CU-49; el frontend los muestra tal cual.
export const REPORT_SHOP_FORBIDDEN_MESSAGE = 'No cuenta con permisos para generar reportes de esta sucursal.';
export const REPORT_INVALID_RANGE_MESSAGE = 'El rango de fechas proporcionado no es válido.';
export const REPORT_NO_DATA_MESSAGE =
    'No hay datos suficientes para generar el reporte en el rango de fechas indicado.';
// Complemento al caso de uso: distingue un nombre mal escrito de un periodo sin actividad.
export const REPORT_BARBER_NOT_FOUND_MESSAGE =
    'No se encontraron barberos con los datos proporcionados en esta sucursal.';

/**
 * Exige dos fechas de calendario reales, con inicio anterior o igual al fin. Un rango de un solo día es válido.
 */
const parseDateRange = (startDate?: string, endDate?: string): { startDate: string; endDate: string } => {
    const start = dateOnlySchema.safeParse(startDate);
    const end = dateOnlySchema.safeParse(endDate);

    // 'YYYY-MM-DD' se ordena igual como texto que como fecha
    if (!start.success || !end.success || start.data > end.data) {
        throw new ApiError(ApiErrorCode.BAD_REQUEST, REPORT_INVALID_RANGE_MESSAGE);
    }
    return { startDate: start.data, endDate: end.data };
};

/** Minúsculas, sin acentos y con espacios simples, para que "jose" encuentre a "José". */
const normalizeName = (value: string): string =>
    value
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .trim()
        .replace(/\s+/g, ' ');

/**
 * La búsqueda coincide al inicio de cualquier palabra del nombre: "juan" o "carlos" encuentran a "Juan Carlos",
 * pero "ana" no encuentra a "Mariana". Una búsqueda vacía coincide con todos.
 */
const matchesName = (name: string, query: string = ''): boolean =>
    ` ${normalizeName(name)}`.includes(` ${normalizeName(query)}`);

/** Un barbero dado de baja solo aparece si tuvo citas en el rango; uno activo aparece siempre. */
const isReportable = (row: BarberPerformance): boolean => row.deleted_at === null || row.scheduled_appointments > 0;

/**
 * Genera el reporte de desempeño de uno o varios barberos de una sucursal (CU-49).
 * Requiere rol de manager, cuenta activa y que la sucursal esté a su cargo. Una sucursal inexistente responde
 * igual que una ajena, para no revelar cuáles existen.
 */
export const generateBarberPerformanceReport = async (
    data: BarberPerformanceReportRequest,
    token: string
): Promise<BarberPerformanceReportResponse> => {
    const performer = await isUserSessionValid(token);

    if (!canGenerateReports(performer)) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, 'Not authorized to generate reports');
    }

    const managedShopIds = await getShopIdsByManagerId(performer.id);
    const shop = canGenerateShopReports(data.shopId, managedShopIds) ? await getShopById(data.shopId) : null;
    if (!shop) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, REPORT_SHOP_FORBIDDEN_MESSAGE);
    }

    const { startDate, endDate } = parseDateRange(data.startDate, data.endDate);

    const performance = await getBarberPerformance({
        shopId: shop.id,
        managedShopIds,
        startDate,
        endDate,
        timeZone: getBusinessTimezone(),
    });

    const matches = performance.filter(
        (row) => matchesName(row.first_name, data.firstName) && matchesName(row.last_name, data.lastName)
    );
    const isSearchingByName = Boolean(data.firstName || data.lastName);
    if (isSearchingByName && matches.length === 0) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, REPORT_BARBER_NOT_FOUND_MESSAGE);
    }

    const evaluated = matches.filter(isReportable);
    const totals = toPerformanceTotals(evaluated);
    if (totals.completedServices === 0) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, REPORT_NO_DATA_MESSAGE);
    }

    return {
        shopId: shop.id,
        shopName: shop.name,
        startDate,
        endDate,
        totals,
        barbers: evaluated.map(toBarberPerformanceResponse),
    };
};
