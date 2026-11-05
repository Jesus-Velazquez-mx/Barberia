import { z, ZodError } from 'zod';
import type { ApiHandler } from '../utils/apiResponse.js';
import { sendFail, sendInternalServerError, sendSuccess, sendValidationError } from '../utils/apiResponse.js';
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import { getAvailableSlots } from '../services/availabilityService.js';
import type { AvailableSlotsByBarber } from '../services/availabilityService.js';
import { getBusinessToday } from '../utils/businessTime.js';
import { extractOptionalBearerFromHeader } from '../utils/headerHandling.js';
import { isUserSessionValid } from '../utils/userSession.js';
import { getAppointmentById } from '../repositories/appointmentRepository.js';
import { getShopById } from '../repositories/shopRepository.js';
import { getReceptionistByUserId } from '../repositories/receptionistRepository.js';
import { canEditAppointment } from '../services/userPermissions.js';

// Validación del ID de la sucursal en los parámetros de la ruta
const getAvailabilityParamsSchema = z.object({
    id: z.uuid('Invalid shop ID format'),
});

// Validación de los parámetros de consulta (query params): fecha, servicios y cita excluida opcional.
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
    excludeAppointmentId: z.uuid('Invalid excludeAppointmentId format').optional(),
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

        // Cuando se pide excluir una cita, se aplican validaciones de seguridad adicionales.
        if (validQuery.excludeAppointmentId) {
            // 1. Se exige token JWT. Sin token → 401.
            const bearerToken = extractOptionalBearerFromHeader(req);
            if (!bearerToken) {
                throw new ApiError(ApiErrorCode.UNAUTHORIZED, 'Token is required when excludeAppointmentId is provided');
            }

            // 2. Validar la sesión (cuenta activa, token válido).
            const performer = await isUserSessionValid(bearerToken);

            // 3. Verificar que la cita exista. Si no → 404.
            const appointment = await getAppointmentById(validQuery.excludeAppointmentId);
            if (!appointment) {
                throw new ApiError(ApiErrorCode.NOT_FOUND, 'Appointment not found');
            }

            // 4. Verificar que la cita pertenezca a la sucursal consultada. Si no → 422.
            if (appointment.shop_id !== shopId) {
                throw new ApiError(
                    ApiErrorCode.INVALID_INPUT,
                    'The appointment does not belong to the requested shop'
                );
            }

            // 5. Verificar que el solicitante pueda editar esa cita (mismas reglas que PUT /appointments/:id). Si no → 403.
            const shop = await getShopById(appointment.shop_id);
            if (!shop) {
                throw new ApiError(ApiErrorCode.NOT_FOUND, 'Shop not found');
            }
            const receptionistShopId =
                performer.role === 'receptionist'
                    ? ((await getReceptionistByUserId(performer.id))?.shop_id ?? null)
                    : null;
            if (
                !canEditAppointment(
                    performer,
                    { clientId: appointment.client_id, shopId: appointment.shop_id, shopManagerId: shop.manager_id },
                    receptionistShopId
                )
            ) {
                throw new ApiError(ApiErrorCode.FORBIDDEN, 'Not authorized to exclude this appointment');
            }
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
