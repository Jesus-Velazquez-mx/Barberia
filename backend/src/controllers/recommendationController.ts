import { generateRecommendation, testConnection } from '../services/aiService.js';
import type { ApiHandler } from '../utils/apiResponse.js';
import { sendSuccess, sendInternalServerError, sendValidationError, sendFail } from '../utils/apiResponse.js';
import type {
    HaircutRecommendationRequest,
    HaircutRecommendationResponse,
    RecommendationHealthResponse,
} from '../types/dto/recommendation.interface.js';
import { z, ZodError } from 'zod';
import { ApiError } from '../errors/ApiError.js';
import { extractBearerFromHeader } from '../utils/headerHandling.js';

const haircutRecommendationSchema = z.object({
    recommendationParams: z.object({
        photo: z.string(),
        userPreferences: z.string().max(500).optional(),
    }) satisfies z.ZodType<HaircutRecommendationRequest>,
    token: z.jwt(),
});

const getHaircutRecommendation: ApiHandler<HaircutRecommendationResponse> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);

        const validData = haircutRecommendationSchema.parse({ ...req.body, token });

        const recommendationResult = await generateRecommendation(validData.recommendationParams, validData.token);

        sendSuccess({ res, message: 'Recomendación de corte generada exitosamente', data: recommendationResult.data });
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

const testRecommendationService: ApiHandler<RecommendationHealthResponse> = async (_req, res) => {
    try {
        const result = await testConnection();
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

export { testRecommendationService as testAiService, getHaircutRecommendation };
