import { type ApiHandler, sendInternalServerError, sendSuccess } from '../utils/apiResponse.js';

export const health: ApiHandler<string> = async (req, res) => {
    try {
        sendSuccess({ res, message: 'OK' });
    } catch (error) {
        sendInternalServerError({ res, error: [String(error)] });
    }
};
