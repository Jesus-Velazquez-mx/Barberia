import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import type { PresignedPost } from '@aws-sdk/s3-presigned-post';
import { ApiError, ApiErrorCode } from '../src/errors/ApiError.js';

const generatePresignedURL = jest.fn<(token: string, target: unknown) => Promise<PresignedPost>>();
const generateHaircutImageURL = jest.fn<(haircutId: string) => Promise<{ url: string; expiresIn: number }>>();

jest.unstable_mockModule('../src/services/bucketService.js', () => ({
    generatePresignedURL,
    generateHaircutImageURL,
}));

const { getBucketPresignedURL, getHaircutImageURL } = await import('../src/controllers/bucketController.js');

const app = express();
app.use(express.json());
app.get('/api/presigned-url', getBucketPresignedURL);
app.get('/api/haircuts/:haircutId/image-url', getHaircutImageURL);

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
        expect(generatePresignedURL).toHaveBeenCalledWith('valid-token', { type: 'user' });
    });

    test('forwards the haircut target when target=haircut', async () => {
        const haircutId = '10000000-0000-4000-8000-000000000021';
        const response = await request(app)
            .get('/api/presigned-url')
            .query({ target: 'haircut', haircutId, contentType: 'image/webp' })
            .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(200);
        expect(generatePresignedURL).toHaveBeenCalledWith('manager-token', {
            type: 'haircut',
            haircutId,
            contentType: 'image/webp',
        });
    });

    test.each([
        ['an unknown target', { target: 'avatar' }],
        ['target=haircut without haircutId', { target: 'haircut', contentType: 'image/png' }],
        ['an invalid haircutId', { target: 'haircut', haircutId: 'abc', contentType: 'image/png' }],
        [
            'an unsupported contentType',
            { target: 'haircut', haircutId: '10000000-0000-4000-8000-000000000021', contentType: 'image/gif' },
        ],
    ])('returns 400 for %s', async (_label, query) => {
        const response = await request(app)
            .get('/api/presigned-url')
            .query(query)
            .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({ message: 'Validation error' });
        expect(generatePresignedURL).not.toHaveBeenCalled();
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

describe('GET /api/haircuts/:haircutId/image-url', () => {
    const haircutId = '10000000-0000-4000-8000-000000000021';
    const imageURL = { url: 'https://signed.example.com/wolf_cut.jpg', expiresIn: 300 };

    beforeEach(() => {
        jest.clearAllMocks();
        generateHaircutImageURL.mockResolvedValue(imageURL);
    });

    test('returns the presigned URL without requiring a token', async () => {
        const response = await request(app).get(`/api/haircuts/${haircutId}/image-url`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            data: imageURL,
            message: 'Haircut image URL generated successfully',
        });
        expect(generateHaircutImageURL).toHaveBeenCalledWith(haircutId);
    });

    test('returns 400 when the haircut id is not a uuid', async () => {
        const response = await request(app).get('/api/haircuts/not-a-uuid/image-url');

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
            message: 'Validation error',
            error: [{ field: 'haircutId', detail: 'Invalid haircut ID format' }],
        });
        expect(generateHaircutImageURL).not.toHaveBeenCalled();
    });

    test('returns the service ApiError status and message', async () => {
        generateHaircutImageURL.mockRejectedValue(new ApiError(ApiErrorCode.NOT_FOUND, 'Haircut image not found'));

        const response = await request(app).get(`/api/haircuts/${haircutId}/image-url`);

        expect(response.status).toBe(ApiErrorCode.NOT_FOUND);
        expect(response.body).toMatchObject({ message: 'Haircut image not found' });
    });

    test('returns 500 for unexpected service errors', async () => {
        generateHaircutImageURL.mockRejectedValue(new Error('S3 unavailable'));

        const response = await request(app).get(`/api/haircuts/${haircutId}/image-url`);

        expect(response.status).toBe(ApiErrorCode.INTERNAL_SERVER_ERROR);
        expect(response.body).toMatchObject({ error: ['Error: S3 unavailable'] });
    });
});
