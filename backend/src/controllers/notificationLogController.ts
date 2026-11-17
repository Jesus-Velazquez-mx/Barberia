import type { ApiHandler } from '../utils/apiResponse.js';
import { sendSuccess, sendFail, sendInternalServerError } from '../utils/apiResponse.js';
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import { extractBearerFromHeader } from '../utils/headerHandling.js';
import { decodeToken } from '../services/jwtTokenService.js';
import { isUserActive } from '../repositories/userRepository.js';
import { sendTestReminders, type TestReminderResult } from '../services/notificationLogService.js';

/**
 * Ejecuta un envío manual de recordatorios de prueba sin registrar en notifications_log.
 */
export const triggerTestReminders: ApiHandler<TestReminderResult> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const actor = decodeToken(token);

        if (!(await isUserActive(actor.id))) {
            throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
        }

        if (actor.role !== 'manager' && actor.role !== 'receptionist') {
            throw new ApiError(ApiErrorCode.FORBIDDEN, 'Only staff can trigger test reminders');
        }

        const result = await sendTestReminders();
        sendSuccess({ res, data: result, message: 'Test reminders sent without logging' });
    } catch (error: unknown) {
        if (error instanceof ApiError) {
            sendFail({ res, message: error.message, status: error.code });
            return;
        }

        sendInternalServerError({ res, error: [String(error)] });
    }
};