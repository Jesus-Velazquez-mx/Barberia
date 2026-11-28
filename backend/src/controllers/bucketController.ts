import type { PresignedPost } from '@aws-sdk/s3-presigned-post';
import type { Response } from 'express';
import {
    generateHaircutImageURL,
    generatePresignedURL,
    type HaircutImageURL,
    type PresignedUploadTarget,
} from '../services/bucketService.js';
import { HAIRCUT_IMAGE_CONTENT_TYPES, type HaircutImageContentType } from '../utils/photoKey.js';
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

const haircutContentTypes = Object.keys(HAIRCUT_IMAGE_CONTENT_TYPES) as [
    HaircutImageContentType,
    ...HaircutImageContentType[],
];

/*
 * ?target=user (por defecto) sube la foto del cliente; ?target=haircut&haircutId=...&contentType=... sube la
 * foto de catálogo de un corte.
 */
const presignedTargetQuerySchema = z.discriminatedUnion('target', [
    z.object({ target: z.literal('user') }),
    z.object({
        target: z.literal('haircut'),
        haircutId: z.uuid('Invalid haircut ID format'),
        contentType: z.enum(haircutContentTypes, 'contentType must be image/jpeg, image/png or image/webp'),
    }),
]);

const parsePresignedTarget = (query: Record<string, unknown>): PresignedUploadTarget => {
    const parsed = presignedTargetQuerySchema.parse({ ...query, target: query.target ?? 'user' });

    return parsed.target === 'haircut'
        ? { type: 'haircut', haircutId: parsed.haircutId, contentType: parsed.contentType }
        : { type: 'user' };
};

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
        const target = parsePresignedTarget(req.query);
        const presignedURL = await generatePresignedURL(token, target);
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
