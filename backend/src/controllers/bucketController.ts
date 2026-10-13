import type { PresignedPost } from "@aws-sdk/s3-presigned-post";
import { generatePresignedURL } from "../services/bucketService.js";
import { type ApiHandler, sendFail, sendInternalServerError, sendSuccess, sendValidationError } from "../utils/apiResponse.js";
import { extractBearerFromHeader } from "../utils/headerHandling.js";
import { ZodError } from "zod";
import { ApiError, ApiErrorCode } from "../errors/ApiError.js";
import { CredentialsProviderError } from "@smithy/property-provider";

export const getBucketPresignedURL: ApiHandler<PresignedPost> = async (req, res) => {
    try {
        const token = extractBearerFromHeader(req);
        const presignedURL = await generatePresignedURL(token);
        sendSuccess({ res, message: 'Presigned URL generated successfully', data: presignedURL })
    } catch (error) {
        if (error instanceof ZodError) {
            sendValidationError({ res, error });
            return;
        }

        if (error instanceof ApiError) {
            sendFail({ res, message: error.message, status: error.code });
            return;
        }

        if (error instanceof CredentialsProviderError) {
            sendFail({ res, message: "AWS credentials could not be resolved", status: ApiErrorCode.BAD_GATEWAY });
            return;
        }

        sendInternalServerError({ res, error: [String(error)] });
    }
}
