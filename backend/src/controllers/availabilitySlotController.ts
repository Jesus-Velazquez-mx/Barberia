import { z, ZodError } from 'zod';
import type { ApiHandler } from '../utils/apiResponse.js';
import { sendFail, sendInternalServerError, sendSuccess, sendValidationError } from '../utils/apiResponse.js';
import { ApiError } from '../errors/ApiError.js';
import { getAvailableSlots } from '../services/availabilityService.js';
import type { AvailableSlotsByBarber } from '../services/availabilityService.js';
import { getBusinessToday } from '../utils/businessTime.js';

// Validación del ID de la sucursal en los parámetros de la ruta
const getAvailabilityParamsSchema = z.object({
    id: z.uuid('Invalid shop ID format'),
});

// Validación de los parámetros de consulta (query params): fecha y servicios.
// serviceIds acepta el parámetro repetido (?serviceIds=a&serviceIds=b) o separado por comas (?serviceIds=a,b).
const getAvailabilityQuerySchema = z.object({
    date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD')
        .refine((val) => val >= getBusinessToday(), { message: 'Date cannot be before today' }),
    serviceIds: z.preprocess(
        (val) => (typeof val === 'string' ? val.split(',') : val),
        z
            .array(z.uuid('Invalid service ID format'), 'serviceIds is required')
            .min(1, 'At least one service is required')
            .refine((ids) => new Set(ids).size === ids.length, { message: 'Duplicate service IDs' })
    ),
});

// Handler público para calcular y consultar los slots de disponibilidad de una sucursal
export const getAvailability: ApiHandler<AvailableSlotsByBarber[]> = async (req, res) => {
    try {
        // Valida los parámetros de ruta y de consulta con sus respectivos esquemas Zod
        const validParams = getAvailabilityParamsSchema.parse({ id: req.params.id });
        const validQuery = getAvailabilityQuerySchema.parse(req.query);

        // Llama al servicio de dominio para calcular los horarios agendables por barbero
        const result = await getAvailableSlots({
            shopId: validParams.id,
            date: validQuery.date,
            serviceIds: validQuery.serviceIds,
        });

        // Retorna respuesta exitosa con los slots disponibles
        sendSuccess({ res, data: result, message: 'Available slots retrieved successfully' });
    } catch (error: unknown) {
        // Error de validación de datos de entrada (Zod)
        if (error instanceof ZodError) {
            sendValidationError({ res, error });
            return;
        }

        // Error controlado de lógica de negocio o recurso no encontrado (ApiError)
        if (error instanceof ApiError) {
            sendFail({ res, message: error.message, status: error.code });
            return;
        }

        // Error no esperado del servidor
        sendInternalServerError({ res, error: [String(error)] });
    }
};
