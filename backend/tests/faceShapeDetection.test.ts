import { jest } from '@jest/globals';

/*
 * Pruebas unitarias de la detección de estructura facial (src/services/aiService.ts).
 *
 * El microservicio de IA, la base de datos y la configuración se reemplazan por
 * mocks, así que estas pruebas NO necesitan que el servicio esté corriendo y son
 * seguras para CI. La validación contra el microservicio real vive en el bloque
 * de integración (faceShapeDetection.integration.test.ts), que solo se ejecuta
 * con RUN_AI_INTEGRATION=1.
 */

const AI_SERVICE_URL = 'http://ai-service.test/internal/v1';
const AI_PROVIDER = 'test-provider';
const AI_API_KEY = 'test-ai-key';
const KEY_PREFIX = 'user/images/';

// ESM: los mocks deben registrarse antes de importar dinámicamente el servicio.
const getUserById = jest.fn<(...args: any[]) => Promise<any>>();
const getClientByUserId = jest.fn<(...args: any[]) => Promise<any>>();
const updateClientFacialStructure = jest.fn<(...args: any[]) => Promise<void>>();
const getActiveHaircutStyles = jest.fn<(...args: any[]) => Promise<any>>();
const getActiveHaircutStylesByFacialStructure = jest.fn<(...args: any[]) => Promise<any>>();
const isUserSessionValid = jest.fn<(...args: any[]) => Promise<any>>();
const calculateAge = jest.fn<(...args: any[]) => number>();

jest.unstable_mockModule('../src/config/globalConfig.js', () => ({
    default: {
        ENV: 'test',
        AI_SERVICE_URL,
        AI_PROVIDER,
        JWT_SECRET: 'x',
        FRONTEND_URL: 'http://localhost',
        AWS_BUCKET_KEY_PREFIX: KEY_PREFIX,
    },
}));
jest.unstable_mockModule('../src/repositories/userRepository.js', () => ({ getUserById }));
jest.unstable_mockModule('../src/repositories/clientRepository.js', () => ({ getClientByUserId, updateClientFacialStructure }));
jest.unstable_mockModule('../src/repositories/haircutRepository.js', () => ({
    getActiveHaircutStyles,
    getActiveHaircutStylesByFacialStructure,
}));
jest.unstable_mockModule('../src/utils/userSession.js', () => ({ isUserSessionValid }));
jest.unstable_mockModule('../src/services/userService.js', () => ({ calculateAge }));

const { detectFacialStructure, generateRecommendation } = await import('../src/services/aiService.js');
const { ApiError, ApiErrorCode } = await import('../src/errors/ApiError.js');

const PHOTO_KEY = `${KEY_PREFIX}7a3be44f-9740-437b-86d2-c0a0463a0ea2`;
const FACE_URL = `${AI_SERVICE_URL}/face/detect-structure`;
const RECOMMEND_URL = `${AI_SERVICE_URL}/haircut/recommend`;

const jsonResponse = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const fetchMock = jest.fn<typeof fetch>();
const realFetch = globalThis.fetch;
const realApiKey = process.env.AI_SERVICE_API_KEY;

/** Cuerpo JSON enviado en la llamada `index` a fetch. */
const sentBody = (index = 0) => JSON.parse(fetchMock.mock.calls[index][1]!.body as string);
const calledUrls = () => fetchMock.mock.calls.map(([url]) => String(url));

beforeAll(() => {
    process.env.AI_SERVICE_API_KEY = AI_API_KEY;
    globalThis.fetch = fetchMock;
});

afterAll(() => {
    globalThis.fetch = realFetch;
    if (realApiKey === undefined) delete process.env.AI_SERVICE_API_KEY;
    else process.env.AI_SERVICE_API_KEY = realApiKey;
});

beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe('detectFacialStructure', () => {
    test('hace POST al endpoint de detección con los headers de autenticación', async () => {
        fetchMock.mockResolvedValue(jsonResponse({ data: { facialStructure: 'heart' }, message: 'ok' }));

        await detectFacialStructure(PHOTO_KEY);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe(FACE_URL);
        expect(init?.method).toBe('POST');
        expect(init?.headers).toEqual({
            'Content-Type': 'application/json',
            'X-Internal-Api-Key': AI_API_KEY,
        });
    });

    test('envía solo la key de la foto en el cuerpo (el modelo facial es local, sin proveedor)', async () => {
        fetchMock.mockResolvedValue(jsonResponse({ data: { facialStructure: 'oval' }, message: 'ok' }));

        await detectFacialStructure(PHOTO_KEY);

        expect(sentBody()).toEqual({ data: { photoKey: PHOTO_KEY } });
    });

    test('devuelve la respuesta JSON del microservicio sin modificarla', async () => {
        const aiResponse = { data: { facialStructure: 'round' }, message: 'Facial structure classified successfully' };
        fetchMock.mockResolvedValue(jsonResponse(aiResponse));

        await expect(detectFacialStructure(PHOTO_KEY)).resolves.toEqual(aiResponse);
    });

    test('lanza ApiError 500 cuando no se puede contactar al microservicio', async () => {
        fetchMock.mockRejectedValue(new TypeError('fetch failed'));

        const error = await detectFacialStructure(PHOTO_KEY).catch((e: unknown) => e);

        expect(error).toBeInstanceOf(ApiError);
        expect((error as InstanceType<typeof ApiError>).code).toBe(ApiErrorCode.INTERNAL_SERVER_ERROR);
        expect((error as Error).message).toMatch(/network error/i);
    });

    test.each([
        { status: 401, body: { message: 'Invalid or missing API key' } },
        { status: 502, body: { message: 'Image storage rejected the credentials' } },
        { status: 503, body: { message: 'Image download timed out' } },
    ])(
        'lanza ApiError 500 con el código $status cuando el microservicio falla por una causa ajena al cliente',
        async ({ status, body }) => {
            fetchMock.mockResolvedValue(jsonResponse(body, status));

            const error = await detectFacialStructure(PHOTO_KEY).catch((e: unknown) => e);

            expect(error).toBeInstanceOf(ApiError);
            expect((error as InstanceType<typeof ApiError>).code).toBe(ApiErrorCode.INTERNAL_SERVER_ERROR);
            expect((error as Error).message).toContain(String(status));
        }
    );

    test.each([
        { status: 400, body: { message: 'Photo was not found' }, expected: 'Photo was not found' },
        {
            status: 422,
            body: { message: 'unprocessable', errors: [{ field: 'photoKey', detail: 'Photo was not found' }] },
            expected: 'Photo was not found',
        },
        { status: 422, body: { message: 'unprocessable' }, expected: 'unprocessable' },
    ])(
        'lanza ApiError 400 con el detalle de la IA cuando la foto no se puede procesar ($status)',
        async ({ status, body, expected }) => {
            fetchMock.mockResolvedValue(jsonResponse(body, status));

            const error = await detectFacialStructure(PHOTO_KEY).catch((e: unknown) => e);

            expect(error).toBeInstanceOf(ApiError);
            expect((error as InstanceType<typeof ApiError>).code).toBe(ApiErrorCode.BAD_REQUEST);
            expect((error as Error).message).toBe(expected);
        }
    );

    test('lanza ApiError 500 si la respuesta de error no es JSON', async () => {
        fetchMock.mockResolvedValue(new Response('<html>bad gateway</html>', { status: 502 }));

        const error = await detectFacialStructure(PHOTO_KEY).catch((e: unknown) => e);

        expect(error).toBeInstanceOf(ApiError);
        expect((error as InstanceType<typeof ApiError>).code).toBe(ApiErrorCode.INTERNAL_SERVER_ERROR);
    });
});

describe('generateRecommendation - detección de estructura facial', () => {
    const TOKEN = 'session-token';
    const haircuts = [{ id: 'h1', name: 'Fade', description: 'desc' }];

    beforeEach(() => {
        isUserSessionValid.mockResolvedValue({ id: 'user-1', role: 'client' });
        getUserById.mockResolvedValue({ id: 'user-1', birth_date: '1995-05-05', gender: 'male' });
        calculateAge.mockReturnValue(30);
        getActiveHaircutStylesByFacialStructure.mockResolvedValue(haircuts);
        getActiveHaircutStyles.mockResolvedValue(haircuts);
    });

    const USER_PHOTO_KEY = `${KEY_PREFIX}user-1`;
    const params: Parameters<typeof generateRecommendation>[0] = { userPreferences: 'corto' };

    test('no llama a la detección si el cliente ya tiene estructura facial', async () => {
        getClientByUserId.mockResolvedValue({ user_id: 'user-1', facial_structure_type: 'square' });
        fetchMock.mockResolvedValue(jsonResponse({ data: { haircuts: [] }, message: 'ok' }));

        await generateRecommendation(params, TOKEN);

        expect(calledUrls()).toEqual([RECOMMEND_URL]);
        expect(getActiveHaircutStylesByFacialStructure).toHaveBeenCalledWith('square');
        expect(updateClientFacialStructure).not.toHaveBeenCalled();
    });

    test('envía a la IA la key de la foto del usuario autenticado, derivada en el servidor', async () => {
        getClientByUserId.mockResolvedValue({ user_id: 'user-1', facial_structure_type: 'square' });
        fetchMock.mockResolvedValue(jsonResponse({ data: { haircuts: [] }, message: 'ok' }));

        await generateRecommendation(params, TOKEN);

        const { data } = sentBody();
        expect(data.photoKey).toBe(USER_PHOTO_KEY);
        expect(data).not.toHaveProperty('photo');
    });

    test('detecta la estructura facial antes de recomendar si el cliente no la tiene', async () => {
        getClientByUserId.mockResolvedValue({ user_id: 'user-1', facial_structure_type: null });
        fetchMock
            .mockResolvedValueOnce(jsonResponse({ data: { facialStructure: 'heart' }, message: 'ok' }))
            .mockResolvedValueOnce(jsonResponse({ data: { haircuts: [] }, message: 'ok' }));

        await generateRecommendation(params, TOKEN);

        expect(calledUrls()).toEqual([FACE_URL, RECOMMEND_URL]);
        expect(sentBody(0).data).toEqual({ photoKey: USER_PHOTO_KEY });
        expect(sentBody(1).data.photoKey).toBe(USER_PHOTO_KEY);
        expect(getActiveHaircutStylesByFacialStructure).toHaveBeenCalledWith('heart');
    });

    test('guarda en la base de datos la estructura facial detectada por la IA', async () => {
        getClientByUserId.mockResolvedValue({ user_id: 'user-1', facial_structure_type: null });
        fetchMock
            .mockResolvedValueOnce(jsonResponse({ data: { facialStructure: 'heart' }, message: 'ok' }))
            .mockResolvedValueOnce(jsonResponse({ data: { haircuts: [] }, message: 'ok' }));

        await generateRecommendation(params, TOKEN);

        expect(updateClientFacialStructure).toHaveBeenCalledTimes(1);
        expect(updateClientFacialStructure).toHaveBeenCalledWith('user-1', 'heart');
        // Se guarda antes de buscar los cortes, que ya dependen de la estructura detectada
        expect(updateClientFacialStructure.mock.invocationCallOrder[0]).toBeLessThan(
            getActiveHaircutStylesByFacialStructure.mock.invocationCallOrder[0]
        );
    });

    test('no guarda nada si la detección falla', async () => {
        getClientByUserId.mockResolvedValue({ user_id: 'user-1', facial_structure_type: null });
        fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'Photo was not found' }, 422));

        await expect(generateRecommendation(params, TOKEN)).rejects.toBeInstanceOf(ApiError);

        expect(updateClientFacialStructure).not.toHaveBeenCalled();
    });

    test('propaga el error si no se puede guardar y no llama a la IA de recomendación', async () => {
        getClientByUserId.mockResolvedValue({ user_id: 'user-1', facial_structure_type: null });
        fetchMock.mockResolvedValueOnce(jsonResponse({ data: { facialStructure: 'heart' }, message: 'ok' }));
        updateClientFacialStructure.mockRejectedValue(new Error('db down'));

        await expect(generateRecommendation(params, TOKEN)).rejects.toThrow('db down');

        expect(calledUrls()).toEqual([FACE_URL]);
    });

    test('lanza ApiError 400 si la IA reporta que la foto no se puede procesar al detectar', async () => {
        getClientByUserId.mockResolvedValue({ user_id: 'user-1', facial_structure_type: null });
        fetchMock.mockResolvedValueOnce(
            jsonResponse({ message: 'unprocessable', errors: [{ field: 'photoKey', detail: 'Photo was not found' }] }, 422)
        );

        const error = await generateRecommendation(params, TOKEN).catch((e: unknown) => e);

        expect(error).toBeInstanceOf(ApiError);
        expect((error as InstanceType<typeof ApiError>).code).toBe(ApiErrorCode.BAD_REQUEST);
        expect((error as Error).message).toBe('Photo was not found');
        expect(calledUrls()).toEqual([FACE_URL]);
    });

    test('envía la estructura facial del cliente en userData y solo los campos de cada corte que usa la IA', async () => {
        getClientByUserId.mockResolvedValue({ user_id: 'user-1', facial_structure_type: 'square' });
        getActiveHaircutStylesByFacialStructure.mockResolvedValue([
            { id: 'h1', name: 'Fade', description: 'desc', is_active: true, created_at: new Date(), updated_at: new Date() },
            { id: 'h2', name: 'Buzz', description: null, is_active: true, created_at: new Date(), updated_at: new Date() },
        ]);
        fetchMock.mockResolvedValue(jsonResponse({ data: { haircuts: [] }, message: 'ok' }));

        await generateRecommendation(params, TOKEN);

        const { data, provider } = sentBody();
        expect(provider).toBe(AI_PROVIDER);
        expect(data.userData).toEqual({
            age: 30,
            gender: 'male',
            facialStructure: 'square',
            userPreferences: 'corto',
        });
        expect(data.suggestedHaircuts).toEqual([
            { id: 'h1', name: 'Fade', description: 'desc' },
            { id: 'h2', name: 'Buzz' },
        ]);
    });

    test('lanza ApiError 400 si la IA reporta que la foto no se puede usar al recomendar', async () => {
        getClientByUserId.mockResolvedValue({ user_id: 'user-1', facial_structure_type: 'square' });
        fetchMock.mockResolvedValue(
            jsonResponse({ message: 'Photo was not found', errors: [{ detail: 'Photo was not found' }] }, 400)
        );

        const error = await generateRecommendation(params, TOKEN).catch((e: unknown) => e);

        expect(error).toBeInstanceOf(ApiError);
        expect((error as InstanceType<typeof ApiError>).code).toBe(ApiErrorCode.BAD_REQUEST);
        expect((error as Error).message).toBe('Photo was not found');
    });

    test('lanza ApiError 500 si la IA de recomendación falla por una causa ajena al cliente', async () => {
        getClientByUserId.mockResolvedValue({ user_id: 'user-1', facial_structure_type: 'square' });
        fetchMock.mockResolvedValue(jsonResponse({ message: 'down' }, 503));

        const error = await generateRecommendation(params, TOKEN).catch((e: unknown) => e);

        expect(error).toBeInstanceOf(ApiError);
        expect((error as InstanceType<typeof ApiError>).code).toBe(ApiErrorCode.INTERNAL_SERVER_ERROR);
    });

    test('lanza ApiError 500 si no se puede contactar a la IA de recomendación', async () => {
        getClientByUserId.mockResolvedValue({ user_id: 'user-1', facial_structure_type: 'square' });
        fetchMock.mockRejectedValue(new TypeError('fetch failed'));

        const error = await generateRecommendation(params, TOKEN).catch((e: unknown) => e);

        expect(error).toBeInstanceOf(ApiError);
        expect((error as InstanceType<typeof ApiError>).code).toBe(ApiErrorCode.INTERNAL_SERVER_ERROR);
    });

    test('lanza ApiError 500 si la detección no devuelve una estructura facial', async () => {
        getClientByUserId.mockResolvedValue({ user_id: 'user-1', facial_structure_type: null });
        fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'no data' }));

        const error = await generateRecommendation(params, TOKEN).catch((e: unknown) => e);

        expect(error).toBeInstanceOf(ApiError);
        expect((error as InstanceType<typeof ApiError>).code).toBe(ApiErrorCode.INTERNAL_SERVER_ERROR);
        expect(calledUrls()).toEqual([FACE_URL]);
        expect(updateClientFacialStructure).not.toHaveBeenCalled();
    });
});
