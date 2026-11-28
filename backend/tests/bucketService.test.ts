import { jest } from '@jest/globals';

/*
 * Pruebas unitarias de generatePresignedURL y generateHaircutImageURL (src/services/bucketService.ts).
 * S3, la base de datos y la sesión se reemplazan por mocks.
 */

const KEY_PREFIX = 'user/images/';
const HAIRCUT_PREFIX = 'haircuts/';

const createPresignedPost = jest.fn<(...args: any[]) => Promise<any>>();
const getSignedUrl = jest.fn<(...args: any[]) => Promise<string>>();
const send = jest.fn<(...args: any[]) => Promise<any>>();
const clearClientFacialStructure = jest.fn<(...args: any[]) => Promise<void>>();
const getHaircutStyleById = jest.fn<(...args: any[]) => Promise<any>>();
const isUserSessionValid = jest.fn<(...args: any[]) => Promise<any>>();

class FakeCommand {
    constructor(public input: Record<string, string>) {}
}
class HeadObjectCommand extends FakeCommand {}
class GetObjectCommand extends FakeCommand {}
class CopyObjectCommand extends FakeCommand {}
class DeleteObjectCommand extends FakeCommand {}

jest.unstable_mockModule('@aws-sdk/client-s3', () => ({
    S3Client: class {
        send = send;
    },
    HeadObjectCommand,
    GetObjectCommand,
    CopyObjectCommand,
    DeleteObjectCommand,
}));
jest.unstable_mockModule('@aws-sdk/credential-providers', () => ({ fromEnv: jest.fn() }));
jest.unstable_mockModule('@aws-sdk/s3-presigned-post', () => ({ createPresignedPost }));
jest.unstable_mockModule('@aws-sdk/s3-request-presigner', () => ({ getSignedUrl }));
jest.unstable_mockModule('../src/config/globalConfig.js', () => ({
    default: {
        AWS_REGION: 'us-east-1',
        AWS_BUCKET: 'bucket',
        AWS_BUCKET_KEY_PREFIX_USER: KEY_PREFIX,
        AWS_BUCKET_KEY_PREFIX_HAIRCUTS: HAIRCUT_PREFIX,
    },
}));
jest.unstable_mockModule('../src/repositories/clientRepository.js', () => ({ clearClientFacialStructure }));
jest.unstable_mockModule('../src/repositories/haircutRepository.js', () => ({ getHaircutStyleById }));
jest.unstable_mockModule('../src/utils/userSession.js', () => ({ isUserSessionValid }));

const { generatePresignedURL, generateHaircutImageURL, moveHaircutPhoto } =
    await import('../src/services/bucketService.js');
const { ApiError, ApiErrorCode } = await import('../src/errors/ApiError.js');

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

describe('generateHaircutImageURL', () => {
    const notFound = () =>
        Object.assign(new Error('Not Found'), { name: 'NotFound', $metadata: { httpStatusCode: 404 } });
    const probedKeys = () => send.mock.calls.map(([command]) => (command as HeadObjectCommand).input.Key);

    beforeEach(() => {
        getHaircutStyleById.mockResolvedValue({ id: 'haircut-1', name: 'Wolf Cut' });
        getSignedUrl.mockResolvedValue('https://signed.example.com/wolf_cut');
    });

    test('firma la foto .jpg cuando existe, sin sesión', async () => {
        send.mockResolvedValue({});

        await expect(generateHaircutImageURL('haircut-1')).resolves.toEqual({
            url: 'https://signed.example.com/wolf_cut',
            expiresIn: 300,
        });

        expect(probedKeys()).toEqual(['haircuts/wolf_cut.jpg']);
        expect(isUserSessionValid).not.toHaveBeenCalled();
        const [, command, options] = getSignedUrl.mock.calls[0]!;
        expect(command).toBeInstanceOf(GetObjectCommand);
        expect((command as GetObjectCommand).input).toEqual({ Bucket: 'bucket', Key: 'haircuts/wolf_cut.jpg' });
        expect(options).toEqual({ expiresIn: 300 });
    });

    test('prueba png y webp cuando no existe la versión anterior', async () => {
        send.mockRejectedValueOnce(notFound()).mockRejectedValueOnce(notFound()).mockResolvedValueOnce({});

        await generateHaircutImageURL('haircut-1');

        expect(probedKeys()).toEqual(['haircuts/wolf_cut.jpg', 'haircuts/wolf_cut.png', 'haircuts/wolf_cut.webp']);
        expect((getSignedUrl.mock.calls[0]![1] as GetObjectCommand).input.Key).toBe('haircuts/wolf_cut.webp');
    });

    test('responde 404 si el corte no existe, sin consultar S3', async () => {
        getHaircutStyleById.mockResolvedValue(null);

        await expect(generateHaircutImageURL('missing')).rejects.toMatchObject({
            code: ApiErrorCode.NOT_FOUND,
            message: 'Haircut not found',
        });

        expect(send).not.toHaveBeenCalled();
    });

    test('responde 404 si no hay imagen en ninguna extensión', async () => {
        send.mockRejectedValue(notFound());

        await expect(generateHaircutImageURL('haircut-1')).rejects.toMatchObject({
            code: ApiErrorCode.NOT_FOUND,
            message: 'Haircut image not found',
        });

        expect(send).toHaveBeenCalledTimes(3);
        expect(getSignedUrl).not.toHaveBeenCalled();
    });

    test('propaga los errores de S3 que no son "no encontrado"', async () => {
        send.mockRejectedValue(
            Object.assign(new Error('Forbidden'), { name: 'Forbidden', $metadata: { httpStatusCode: 403 } })
        );

        await expect(generateHaircutImageURL('haircut-1')).rejects.toThrow('Forbidden');

        expect(send).toHaveBeenCalledTimes(1);
        expect(getSignedUrl).not.toHaveBeenCalled();
    });
});

const notFoundError = () =>
    Object.assign(new Error('Not Found'), { name: 'NotFound', $metadata: { httpStatusCode: 404 } });
const sentCommands = () => send.mock.calls.map(([command]) => command as FakeCommand);

describe('generatePresignedURL con target haircut', () => {
    const target = { type: 'haircut' as const, haircutId: 'haircut-1', contentType: 'image/png' as const };

    beforeEach(() => {
        isUserSessionValid.mockResolvedValue({ id: 'manager-1', role: 'manager' });
        getHaircutStyleById.mockResolvedValue({ id: 'haircut-1', name: 'Wolf Cut' });
        send.mockResolvedValue({});
    });

    test('firma la key del corte con su extensión y exige el Content-Type exacto', async () => {
        await expect(generatePresignedURL('token', target)).resolves.toEqual(presignedPost);

        const [, options] = createPresignedPost.mock.calls[0]!;
        expect(options).toEqual({
            Bucket: 'bucket',
            Key: 'haircuts/wolf_cut.png',
            Conditions: [
                ['eq', '$Content-Type', 'image/png'],
                ['content-length-range', 0, 5 * 1024 * 1024],
            ],
            Expires: 120,
        });
    });

    test('elimina las fotos del corte con otra extensión para que la nueva sea la única', async () => {
        await generatePresignedURL('token', target);

        const commands = sentCommands();
        expect(commands.every((command) => command instanceof DeleteObjectCommand)).toBe(true);
        expect(commands.map((command) => command.input.Key)).toEqual([
            'haircuts/wolf_cut.jpg',
            'haircuts/wolf_cut.webp',
        ]);
    });

    test('ignora que la foto con otra extensión no exista', async () => {
        send.mockRejectedValue(notFoundError());

        await expect(generatePresignedURL('token', target)).resolves.toEqual(presignedPost);
    });

    test('no descarta la estructura facial de nadie', async () => {
        await generatePresignedURL('token', target);

        expect(clearClientFacialStructure).not.toHaveBeenCalled();
    });

    test.each(['client', 'receptionist'])('rechaza al rol %s con 403', async (role) => {
        isUserSessionValid.mockResolvedValue({ id: 'user-1', role });

        await expect(generatePresignedURL('token', target)).rejects.toMatchObject({ code: ApiErrorCode.FORBIDDEN });

        expect(getHaircutStyleById).not.toHaveBeenCalled();
        expect(createPresignedPost).not.toHaveBeenCalled();
    });

    test('responde 404 si el corte no existe, sin tocar S3', async () => {
        getHaircutStyleById.mockResolvedValue(null);

        await expect(generatePresignedURL('token', target)).rejects.toMatchObject({
            code: ApiErrorCode.NOT_FOUND,
            message: 'Haircut not found',
        });

        expect(send).not.toHaveBeenCalled();
        expect(createPresignedPost).not.toHaveBeenCalled();
    });

    test('un manager no puede pedir el formulario de la foto de cliente', async () => {
        await expect(generatePresignedURL('token', { type: 'user' })).rejects.toMatchObject({
            code: ApiErrorCode.FORBIDDEN,
        });
    });
});

describe('moveHaircutPhoto', () => {
    test('copia la foto existente a la key del nombre nuevo y borra la anterior', async () => {
        // HeadObject: solo existe la versión png
        send.mockImplementation(async (command: any) => {
            if (command instanceof HeadObjectCommand) {
                if (command.input.Key === 'haircuts/wolf_cut.png') return {};
                throw notFoundError();
            }
            return {};
        });

        await moveHaircutPhoto('Wolf Cut', 'Wolf Cut Largo');

        const copy = sentCommands().find((command) => command instanceof CopyObjectCommand)!;
        expect(copy.input).toEqual({
            Bucket: 'bucket',
            CopySource: `bucket/${encodeURIComponent('haircuts/wolf_cut.png')}`,
            Key: 'haircuts/wolf_cut_largo.png',
        });
        const deletes = sentCommands().filter((command) => command instanceof DeleteObjectCommand);
        expect(deletes.map((command) => command.input.Key)).toEqual(['haircuts/wolf_cut.png']);
    });

    test('no hace nada si el corte no tiene foto', async () => {
        send.mockRejectedValue(notFoundError());

        await moveHaircutPhoto('Wolf Cut', 'Mullet');

        expect(sentCommands().every((command) => command instanceof HeadObjectCommand)).toBe(true);
        expect(send).toHaveBeenCalledTimes(3);
    });

    test('no hace nada si el nombre nuevo genera la misma key', async () => {
        await moveHaircutPhoto('Wolf Cut', 'wolf-cut');

        expect(send).not.toHaveBeenCalled();
    });

    test('propaga los errores de S3 al copiar', async () => {
        send.mockImplementation(async (command: any) => {
            if (command instanceof CopyObjectCommand) throw new Error('Access Denied');
            return {};
        });

        await expect(moveHaircutPhoto('Wolf Cut', 'Mullet')).rejects.toThrow('Access Denied');
    });
});
