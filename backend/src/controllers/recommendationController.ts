import aiService from '../services/aiService.js';
import type { ApiHandler } from '../utils/apiResponse.js';
import { sendSuccess, sendInternalServerError } from '../utils/apiResponse.js';
import type { AiApiHealthResponse } from '../types/dto/aiApiHealthResponse.interface.js';

const testAiService: ApiHandler<AiApiHealthResponse> = async (_req, res) => {
    try {
        const result = await aiService.testConnection();
        sendSuccess({ res, data: result, message: 'Conexión con el servicio de recomendación exitosa' });
    } catch (error) {
        console.error('Error al conectar con el servicio de recomendación:', error);
        sendInternalServerError({
            res,
            error: [String(error)],
            message: 'Error al conectar con el servicio de recomendación',
        });
    }
};

export default { testAiService };
