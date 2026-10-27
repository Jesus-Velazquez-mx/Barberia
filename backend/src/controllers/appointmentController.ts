import { z, ZodError } from 'zod';
import type { ApiHandler } from '../utils/apiResponse.js';
import { sendFail, sendInternalServerError, sendSuccess, sendValidationError } from '../utils/apiResponse.js';
import { ApiError } from '../errors/ApiError.js';
import { listAppointments, registerAppointment, updateAppointment } from '../services/appointmentService.js';
import type { AppointmentResponse, ClientAppointmentResponse } from '../types/dto/appointmentResponse.interface.js';
import { extractBearerFromHeader } from '../utils/headerHandling.js';

// Campos compartidos por agendar y editar una cita.
const barberIdField = z.uuid('Invalid barber ID format');
const serviceIdsField = z
    .array(z.uuid('Invalid service ID format'))
    .min(1, 'At least one service is required')
    .refine((ids) => new Set(ids).size === ids.length, { message: 'Duplicate service IDs' });
const scheduledStartField = z.iso.datetime({ message: 'Invalid scheduledStart, expected ISO 8601 date-time' });
const notesField = z.string().trim().max(500, 'Notes must be at most 500 characters');

const createAppointmentSchema = z
    .object({
        barberId: barberIdField,
        serviceIds: serviceIdsField,
        scheduledStart: scheduledStartField,
        clientId: z.uuid('Invalid client ID format').optional(),
        guestClientName: z
            .string()
            .trim()
            .min(1, 'Guest client name must not be empty')
            .max(100, 'Guest client name must be at most 100 characters')
            .optional(),
        notes: notesField.optional(),
    })
    .refine((data) => !(data.clientId && data.guestClientName), {
        message: 'Provide either clientId or guestClientName, not both',
    });

// El cliente, el invitado y la sucursal no se pueden editar: strict() rechaza cualquier otro campo.
const updateAppointmentSchema = z
    .strictObject({
        barberId: barberIdField.optional(),
        serviceIds: serviceIdsField.optional(),
        scheduledStart: scheduledStartField.optional(),
        notes: notesField.nullable().optional(),
    })
    .refine((data) => Object.values(data).some((value) => value !== undefined), {
        message: 'At least one field to update is required',
    });

const appointmentIdParamSchema = z.object({ id: z.uuid('Invalid appointment ID format') });

const APPOINTMENT_STATUSES = ['scheduled', 'rescheduled', 'checked_in', 'completed', 'cancelled', 'no_show'] as const;

// status acepta el parámetro repetido (?status=a&status=b) o separado por comas (?status=a,b).
const listAppointmentsQuerySchema = z.object({
    from: z.iso
        .datetime({ offset: true, message: 'Invalid from, expected ISO 8601 date-time' })
        .transform((val) => new Date(val))
        .optional(),
    to: z.iso
        .datetime({ offset: true, message: 'Invalid to, expected ISO 8601 date-time' })
        .transform((val) => new Date(val))
        .optional(),
    status: z
        .preprocess(
            (val) => (typeof val === 'string' ? val.split(',') : val),
            z
                .array(z.enum(APPOINTMENT_STATUSES, 'Invalid status'))
                .min(1, 'At least one status is required')
                .transform((statuses) => [...new Set(statuses)])
        )
        .optional(),
    clientId: z.uuid('Invalid client ID format').optional(),
    shopId: z.uuid('Invalid shop ID format').optional(),
    clientType: z.enum(['registered', 'visitor'], 'Invalid clientType, expected registered or visitor').optional(),
    barberId: z.uuid('Invalid barber ID format').optional(),
});

// Agendar cita.
export const create: ApiHandler<AppointmentResponse | ClientAppointmentResponse> = async (req, res) => {
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

// Editar cita (horario, barbero, servicios y notas).
export const update: ApiHandler<AppointmentResponse | ClientAppointmentResponse> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const { id } = appointmentIdParamSchema.parse(req.params);
        const validData = updateAppointmentSchema.parse(req.body);

        const result = await updateAppointment(id, validData, token);

        sendSuccess({ res, data: result, message: 'Appointment updated successfully' });
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

// Consultar citas según el rol del solicitante.
export const list: ApiHandler<AppointmentResponse[] | ClientAppointmentResponse[]> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const validQuery = listAppointmentsQuerySchema.parse(req.query);

        const result = await listAppointments(validQuery, token);

        sendSuccess({ res, data: result, message: 'Appointments retrieved successfully' });
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
