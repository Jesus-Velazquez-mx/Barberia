import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import globalConfig from "../config/globalConfig.js";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { ApiError, ApiErrorCode } from "../errors/ApiError.js";
import { isUserSessionValid } from "../utils/userSession.js";
import { fromEnv } from "@aws-sdk/credential-providers";
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const client = new S3Client({
    region: globalConfig.AWS_REGION,
    credentials: fromEnv()
});

export const generatePresignedURL = async (token: string) => {
    const performer = await isUserSessionValid(token);

    if (performer.role !== 'client') {
        throw new ApiError(ApiErrorCode.UNAUTHORIZED, 'This feature is only available for clients');
    }

    const key = globalConfig.AWS_BUCKET_KEY_PREFIX + performer.id;

    return await createPresignedPost(client, {
        Bucket: globalConfig.AWS_BUCKET,
        Key: key,
        Conditions: [
            ["starts-with", "$Content-Type", "image/"],
            ["content-length-range", 0, 5 * 1024 * 1024]
        ],
        Expires: 120
    });
}
