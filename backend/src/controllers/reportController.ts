import { z, ZodError } from 'zod';
import type { ApiHandler } from '../utils/apiResponse.js';
import { sendFail, sendInternalServerError, sendSuccess, sendValidationError } from '../utils/apiResponse.js';
import { ApiError } from '../errors/ApiError.js';
import { generateBarberPerformanceReport } from '../services/reportService.js';
import { extractBearerFromHeader } from '../utils/headerHandling.js';
import type { BarberPerformanceReportResponse } from '../types/dto/reportResponse.interface.js';

// El rango de fechas se valida en el servicio, que responde un único mensaje para cualquier rango inválido.
const barberPerformanceQuerySchema = z.object({
    shopId: z.uuid('Invalid shop ID format'),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    firstName: z.string().trim().max(100, 'First name must be at most 100 characters').optional(),
    lastName: z.string().trim().max(100, 'Last name must be at most 100 characters').optional(),
});

/**
 * Generar el reporte de desempeño de uno o varios barberos.
 */
export const barberPerformance: ApiHandler<BarberPerformanceReportResponse> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const validQuery = barberPerformanceQuerySchema.parse(req.query);

        const result = await generateBarberPerformanceReport(validQuery, token);

        sendSuccess({ res, data: result, message: 'Report generated successfully' });
    } catch (error: unknown) {
        if (error instanceof ZodError) {
            sendValidationError({ res, error });
            return;
        }
        if (error instanceof ApiError) {
            sendFail({ res, message: error.message, status: error.code });
            return;
        }
        sendInternalServerError({ res, error: [String(error)] });
    }
};
