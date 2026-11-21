import { type ApiHandler, sendInternalServerError, sendSuccess } from '../utils/apiResponse.js';
import { getBusinessTimezone } from '../utils/businessTime.js';

/** GET /business-timezone — zona horaria IANA del negocio (BUSINESS_TIMEZONE). Pública. */
export const getTimezone: ApiHandler<string> = async (req, res) => {
    try {
        sendSuccess({ res, message: 'Zona horaria del negocio obtenida correctamente', data: getBusinessTimezone() });
    } catch (error) {
        sendInternalServerError({ res, error: [String(error)] });
    }
};
