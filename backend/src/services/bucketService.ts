import { S3Client } from "@aws-sdk/client-s3";
import globalConfig from "../config/globalConfig.js";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { ApiError, ApiErrorCode } from "../errors/ApiError.js";
import { isUserSessionValid } from "../utils/userSession.js";
import { getUserPhotoKey } from "../utils/photoKey.js";
import { fromEnv } from "@aws-sdk/credential-providers";
import { clearClientFacialStructure } from "../repositories/clientRepository.js";

const client = new S3Client({
    region: globalConfig.AWS_REGION,
    credentials: fromEnv()
});

export const generatePresignedURL = async (token: string) => {
    const performer = await isUserSessionValid(token);

    if (performer.role !== 'client') {
        throw new ApiError(ApiErrorCode.UNAUTHORIZED, 'This feature is only available for clients');
    }

    const presignedPost = await createPresignedPost(client, {
        Bucket: globalConfig.AWS_BUCKET,
        Key: getUserPhotoKey(performer.id),
        Conditions: [
            ["starts-with", "$Content-Type", "image/"],
            ["content-length-range", 0, 5 * 1024 * 1024]
        ],
        Expires: 120
    });

    // Cada usuario tiene una sola foto y subir una nueva reemplaza la anterior, así que la estructura facial
    // guardada deja de ser confiable: se descarta para que la siguiente recomendación la detecte de nuevo.
    await clearClientFacialStructure(performer.id);

    return presignedPost;
}
