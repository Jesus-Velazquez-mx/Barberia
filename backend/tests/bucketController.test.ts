import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import type { PresignedPost } from '@aws-sdk/s3-presigned-post';
import { ApiError, ApiErrorCode } from '../src/errors/ApiError.js';

const generatePresignedURL = jest.fn<(token: string) => Promise<PresignedPost>>();

jest.unstable_mockModule('../src/services/bucketService.js', () => ({
    generatePresignedURL,
}));

const { getBucketPresignedURL } = await import('../src/controllers/bucketController.js');

const app = express();
app.use(express.json());
app.get('/api/presigned-url', getBucketPresignedURL);

const presignedPost: PresignedPost = {
    url: 'https://s3.example.com',
    fields: {
        key: 'user/images/client-1',
        policy: 'policy',
        'x-amz-signature': 'signature',
    },
};

describe('GET /api/presigned-url', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        generatePresignedURL.mockResolvedValue(presignedPost);
    });

    test('returns a presigned POST and forwards the bearer token', async () => {
        const response = await request(app).get('/api/presigned-url').set('Authorization', 'Bearer valid-token');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            data: presignedPost,
            message: 'Presigned URL generated successfully',
        });
        expect(generatePresignedURL).toHaveBeenCalledWith('valid-token');
    });

    test('returns 401 when the authorization header is missing', async () => {
        const response = await request(app).get('/api/presigned-url');

        expect(response.status).toBe(ApiErrorCode.UNAUTHORIZED);
        expect(response.body).toMatchObject({
            message: 'Missing or invalid authorization token',
        });
        expect(generatePresignedURL).not.toHaveBeenCalled();
    });

    test('returns the service ApiError status and message', async () => {
        generatePresignedURL.mockRejectedValue(
            new ApiError(ApiErrorCode.FORBIDDEN, 'This feature is only available for clients')
        );

        const response = await request(app).get('/api/presigned-url').set('Authorization', 'Bearer staff-token');

        expect(response.status).toBe(ApiErrorCode.FORBIDDEN);
        expect(response.body).toMatchObject({
            message: 'This feature is only available for clients',
        });
    });

    test('returns 500 for unexpected service errors', async () => {
        generatePresignedURL.mockRejectedValue(new Error('S3 unavailable'));

        const response = await request(app).get('/api/presigned-url').set('Authorization', 'Bearer valid-token');

        expect(response.status).toBe(ApiErrorCode.INTERNAL_SERVER_ERROR);
        expect(response.body).toMatchObject({
            message: 'An unexpected error ocurred',
            error: ['Error: S3 unavailable'],
        });
    });
});
