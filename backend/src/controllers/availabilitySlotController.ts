import { z, ZodError } from 'zod';
import type { ApiHandler } from '../utils/apiResponse.js';
import { sendFail, sendInternalServerError, sendSuccess, sendValidationError } from '../utils/apiResponse.js';
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import { getAvailableSlots, getNextAvailableSlots } from '../services/availabilityService.js';
import type { AvailableSlotsByBarber, NextAvailableSlot } from '../services/availabilityService.js';
import { getBusinessToday } from '../utils/businessTime.js';
import { extractBearerFromHeader, extractOptionalBearerFromHeader } from '../utils/headerHandling.js';
import {
    assertCanExcludeAppointmentFromAvailability,
    assertCanManageShopWalkIns,
} from '../services/appointmentService.js';

// Validación del ID de la sucursal en los parámetros de la ruta
const getAvailabilityParamsSchema = z.object({
    id: z.uuid('Invalid shop ID format'),
});

// serviceIds acepta el parámetro repetido (?serviceIds=a&serviceIds=b) o separado por comas (?serviceIds=a,b).
const serviceIdsQueryField = z.preprocess(
    (val) => (typeof val === 'string' ? val.split(',') : val),
    z
        .array(z.uuid('Invalid service ID format'), 'serviceIds is required')
        .min(1, 'At least one service is required')
        .refine((ids) => new Set(ids).size === ids.length, { message: 'Duplicate service IDs' })
);

// Validación de los parámetros de consulta (query params): fecha, servicios y cita excluida opcional.
const getAvailabilityQuerySchema = z.object({
    date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD')
        .refine((val) => val >= getBusinessToday(), { message: 'Date cannot be before today' }),
    serviceIds: serviceIdsQueryField,
    excludeAppointmentId: z.uuid('Invalid excludeAppointmentId format').optional(),
});

// Validación de los parámetros de consulta del próximo slot por barbero: solo servicios (la fecha siempre es hoy).
const getNextAvailabilityQuerySchema = z.object({
    serviceIds: serviceIdsQueryField,
});

// Handler público para calcular y consultar los slots de disponibilidad de una sucursal.
// Cuando se envía `excludeAppointmentId`, se exige token JWT y se valida que el solicitante
// tenga permiso para editar esa cita (mismas reglas que PUT /api/appointments/:id).
export const getAvailability: ApiHandler<AvailableSlotsByBarber[]> = async (req, res) => {
    try {
        // Valida los parámetros de ruta y de consulta con sus respectivos esquemas Zod
        const validParams = getAvailabilityParamsSchema.parse({ id: req.params.id });
        const validQuery = getAvailabilityQuerySchema.parse(req.query);
        const shopId = validParams.id;

        // Excluir una cita exige token (401) y las mismas reglas de alcance que PUT /appointments/:id:
        // cita inexistente → 404, sin permiso → 403, cita de otra sucursal → 422 (en ese orden).
        if (validQuery.excludeAppointmentId) {
            const bearerToken = extractOptionalBearerFromHeader(req);
            if (!bearerToken) {
                throw new ApiError(
                    ApiErrorCode.UNAUTHORIZED,
                    'Token is required when excludeAppointmentId is provided'
                );
            }
            await assertCanExcludeAppointmentFromAvailability(validQuery.excludeAppointmentId, bearerToken, shopId);
        }

        // Llama al servicio de dominio para calcular los horarios agendables por barbero
        const result = await getAvailableSlots({
            shopId,
            date: validQuery.date,
            serviceIds: validQuery.serviceIds,
            excludeAppointmentId: validQuery.excludeAppointmentId,
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

// Handler para consultar el próximo slot disponible hoy de cada barbero de la sucursal (apoyo al walk-in).
// Requiere token JWT y que el solicitante sea personal de la sucursal (su recepcionista o su manager).
export const getNextAvailability: ApiHandler<NextAvailableSlot[]> = async (req, res) => {
    try {
        // Valida los parámetros de ruta y de consulta con sus respectivos esquemas Zod
        const validParams = getAvailabilityParamsSchema.parse({ id: req.params.id });
        const validQuery = getNextAvailabilityQuerySchema.parse(req.query);
        const shopId = validParams.id;

        // Solo personal de la sucursal: sin token → 401, cliente o staff de otra sucursal → 403
        const bearerToken = extractBearerFromHeader(req);
        await assertCanManageShopWalkIns(shopId, bearerToken);

        // Llama al servicio de dominio para obtener el próximo slot de hoy por barbero
        const result = await getNextAvailableSlots({ shopId, serviceIds: validQuery.serviceIds });

        // Retorna respuesta exitosa (lista vacía si a ningún barbero le queda disponibilidad hoy)
        sendSuccess({ res, data: result, message: 'Next available slots retrieved successfully' });
    } catch (error: unknown) {
        // Error de validación de datos de entrada (Zod)
        if (error instanceof ZodError) {
            sendValidationError({ res, error });
            return;
        }

        // Error controlado de autenticación, permisos o recurso no encontrado (ApiError)
        if (error instanceof ApiError) {
            sendFail({ res, message: error.message, status: error.code });
            return;
        }

        // Error no esperado del servidor
        sendInternalServerError({ res, error: [String(error)] });
    }
};
