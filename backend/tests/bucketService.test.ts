import { jest } from '@jest/globals';

/*
 * Pruebas unitarias de generatePresignedURL (src/services/bucketService.ts).
 * S3, la base de datos y la sesión se reemplazan por mocks.
 */

const KEY_PREFIX = 'user/images/';

const createPresignedPost = jest.fn<(...args: any[]) => Promise<any>>();
const clearClientFacialStructure = jest.fn<(...args: any[]) => Promise<void>>();
const isUserSessionValid = jest.fn<(...args: any[]) => Promise<any>>();

jest.unstable_mockModule('@aws-sdk/client-s3', () => ({ S3Client: jest.fn() }));
jest.unstable_mockModule('@aws-sdk/credential-providers', () => ({ fromEnv: jest.fn() }));
jest.unstable_mockModule('@aws-sdk/s3-presigned-post', () => ({ createPresignedPost }));
jest.unstable_mockModule('../src/config/globalConfig.js', () => ({
    default: { AWS_REGION: 'us-east-1', AWS_BUCKET: 'bucket', AWS_BUCKET_KEY_PREFIX: KEY_PREFIX },
}));
jest.unstable_mockModule('../src/repositories/clientRepository.js', () => ({ clearClientFacialStructure }));
jest.unstable_mockModule('../src/utils/userSession.js', () => ({ isUserSessionValid }));

const { generatePresignedURL } = await import('../src/services/bucketService.js');
const { ApiError } = await import('../src/errors/ApiError.js');

const presignedPost = { url: 'https://s3.example.com', fields: { key: `${KEY_PREFIX}user-1` } };

beforeEach(() => {
    jest.resetAllMocks();
    isUserSessionValid.mockResolvedValue({ id: 'user-1', role: 'client' });
    createPresignedPost.mockResolvedValue(presignedPost);
});

describe('generatePresignedURL', () => {
    test('descarta la estructura facial guardada porque la foto se va a reemplazar', async () => {
        await expect(generatePresignedURL('token')).resolves.toEqual(presignedPost);

        expect(clearClientFacialStructure).toHaveBeenCalledWith('user-1');
    });

    test('no descarta la estructura facial si no se pudo generar el formulario', async () => {
        createPresignedPost.mockRejectedValue(new Error('aws down'));

        await expect(generatePresignedURL('token')).rejects.toThrow('aws down');

        expect(clearClientFacialStructure).not.toHaveBeenCalled();
    });

    test('rechaza a quien no es cliente sin tocar la base de datos', async () => {
        isUserSessionValid.mockResolvedValue({ id: 'barber-1', role: 'barber' });

        await expect(generatePresignedURL('token')).rejects.toBeInstanceOf(ApiError);

        expect(createPresignedPost).not.toHaveBeenCalled();
        expect(clearClientFacialStructure).not.toHaveBeenCalled();
    });
});
