import aiService from '../services/aiService.js';
import type { ApiHandler } from '../utils/apiResponse.js';
import { sendSuccess, sendFail } from '../utils/apiResponse.js';
import type { AiApiHealthResponse } from '../types/dto/aiApiHealthResponse.interface.js';

const testAiService: ApiHandler<AiApiHealthResponse> = async (_req, res) => {
    try {
        const result = await aiService.testConnection();
        sendSuccess(res, result, 'Conexión con el servicio de recomendación exitosa', 200);
    } catch (error) {
        console.error('Error al conectar con el servicio de recomendación:', error);
        sendFail(res, 'Error al conectar con el servicio de recomendación', [String(error)], 500);
    }
};

export default { testAiService };
