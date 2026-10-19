import { z, ZodError } from 'zod';
import type { ApiHandler } from '../utils/apiResponse.js';
import { sendFail, sendInternalServerError, sendSuccess, sendValidationError } from '../utils/apiResponse.js';
import { ApiError } from '../errors/ApiError.js';
import { registerAppointment } from '../services/appointmentService.js';
import type { AppointmentResponse } from '../types/dto/appointmentResponse.interface.js';
import { extractBearerFromHeader } from '../utils/headerHandling.js';

const createAppointmentSchema = z
    .object({
        shopId: z.uuid('Invalid shop ID format'),
        barberId: z.uuid('Invalid barber ID format'),
        serviceIds: z
            .array(z.uuid('Invalid service ID format'))
            .min(1, 'At least one service is required')
            .refine((ids) => new Set(ids).size === ids.length, { message: 'Duplicate service IDs' }),
        scheduledStart: z.iso.datetime({ message: 'Invalid scheduledStart, expected ISO 8601 date-time' }),
        clientId: z.uuid('Invalid client ID format').optional(),
        guestClientName: z
            .string()
            .trim()
            .min(1, 'Guest client name must not be empty')
            .max(100, 'Guest client name must be at most 100 characters')
            .optional(),
        notes: z.string().trim().max(500, 'Notes must be at most 500 characters').optional(),
    })
    .refine((data) => !(data.clientId && data.guestClientName), {
        message: 'Provide either clientId or guestClientName, not both',
    });

// Agendar cita.
export const create: ApiHandler<AppointmentResponse> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const validData = createAppointmentSchema.parse(req.body);

        const result = await registerAppointment(validData, token);

        sendSuccess({ res, data: result, message: 'Appointment created successfully', status: 201 });
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
