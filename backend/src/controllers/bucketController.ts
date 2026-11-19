import type { PresignedPost } from '@aws-sdk/s3-presigned-post';
import type { Response } from 'express';
import { generateHaircutImageURL, generatePresignedURL, type HaircutImageURL } from '../services/bucketService.js';
import {
    type ApiHandler,
    sendFail,
    sendInternalServerError,
    sendSuccess,
    sendValidationError,
} from '../utils/apiResponse.js';
import { extractBearerFromHeader } from '../utils/headerHandling.js';
import { z, ZodError } from 'zod';
import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import { CredentialsProviderError } from '@smithy/property-provider';

const haircutIdParamsSchema = z.object({
    haircutId: z.uuid('Invalid haircut ID format'),
});

const handleBucketError = (res: Response, error: unknown): void => {
    if (error instanceof ZodError) {
        sendValidationError({ res, error });
        return;
    }

    if (error instanceof ApiError) {
        sendFail({ res, message: error.message, status: error.code });
        return;
    }

    if (error instanceof CredentialsProviderError) {
        sendFail({ res, message: 'AWS credentials could not be resolved', status: ApiErrorCode.BAD_GATEWAY });
        return;
    }

    sendInternalServerError({ res, error: [String(error)] });
};

export const getBucketPresignedURL: ApiHandler<PresignedPost> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const presignedURL = await generatePresignedURL(token);
        sendSuccess({ res, message: 'Presigned URL generated successfully', data: presignedURL });
    } catch (error) {
        handleBucketError(res, error);
    }
};

export const getHaircutImageURL: ApiHandler<HaircutImageURL> = async (req, res) => {
    try {
        const { haircutId } = haircutIdParamsSchema.parse({ haircutId: req.params.haircutId });
        const imageURL = await generateHaircutImageURL(haircutId);
        sendSuccess({ res, message: 'Haircut image URL generated successfully', data: imageURL });
    } catch (error) {
        handleBucketError(res, error);
    }
};
