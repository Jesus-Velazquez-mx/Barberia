import { z, ZodError } from 'zod';
import type { ApiHandler } from '../utils/apiResponse.js';
import { sendFail, sendInternalServerError, sendSuccess, sendValidationError } from '../utils/apiResponse.js';
import { ApiError } from '../errors/ApiError.js';
import { getAvailableSlots } from '../services/availabilityService.js';
import type { AvailableSlotsByBarber } from '../services/availabilityService.js';

// Validación del ID de la sucursal en los parámetros de la ruta
const getAvailabilityParamsSchema = z.object({
    id: z.uuid('Invalid shop ID format'),
});

// Validación de los parámetros de consulta (query params): fecha y servicio
const getAvailabilityQuerySchema = z.object({
    date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD')
        .refine(
            (val) => {
                const now = new Date();
                const offsetMs = now.getTimezoneOffset() * 60_000;
                const localToday = new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
                return val >= localToday;
            },
            { message: 'Date cannot be before today' }
        ),
    serviceId: z.uuid('Invalid service ID format'),
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
            serviceId: validQuery.serviceId,
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
