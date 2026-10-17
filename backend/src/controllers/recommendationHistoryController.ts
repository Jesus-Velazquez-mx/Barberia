import { z, ZodError } from 'zod';
import { ApiError } from '../errors/ApiError.js';
import { getRecommendationHistory } from '../services/recommendationHistoryService.js';
import type { RecommendationHistoryEntryDTO } from '../types/dto/recommendation.interface.js';
import type { ApiHandler } from '../utils/apiResponse.js';
import { sendFail, sendInternalServerError, sendSuccess, sendValidationError } from '../utils/apiResponse.js';
import { extractBearerFromHeader } from '../utils/headerHandling.js';

const recommendationHistorySchema = z.object({
    clientId: z.uuid('Invalid client ID format'),
    token: z.jwt(),
});

export const getClientRecommendationHistory: ApiHandler<RecommendationHistoryEntryDTO[]> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);

        const validData = recommendationHistorySchema.parse({ clientId: req.query.clientId, token });

        const history = await getRecommendationHistory(validData.clientId, validData.token);

        sendSuccess({ res, message: 'Recommendation history retrieved successfully', data: history });
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
