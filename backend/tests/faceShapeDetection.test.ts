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

// ESM: los mocks deben registrarse antes de importar dinámicamente el servicio.
const getUserById = jest.fn<(...args: any[]) => Promise<any>>();
const getClientByUserId = jest.fn<(...args: any[]) => Promise<any>>();
const getActiveHaircutStyles = jest.fn<(...args: any[]) => Promise<any>>();
const getActiveHaircutStylesByFacialStructure = jest.fn<(...args: any[]) => Promise<any>>();
const isUserSessionValid = jest.fn<(...args: any[]) => Promise<any>>();
const calculateAge = jest.fn<(...args: any[]) => number>();

jest.unstable_mockModule('../src/config/globalConfig.js', () => ({
    default: { ENV: 'test', AI_SERVICE_URL, AI_PROVIDER, JWT_SECRET: 'x', FRONTEND_URL: 'http://localhost' },
}));
jest.unstable_mockModule('../src/repositories/userRepository.js', () => ({ getUserById }));
jest.unstable_mockModule('../src/repositories/clientRepository.js', () => ({ getClientByUserId }));
jest.unstable_mockModule('../src/repositories/haircutRepository.js', () => ({
    getActiveHaircutStyles,
    getActiveHaircutStylesByFacialStructure,
}));
jest.unstable_mockModule('../src/utils/userSession.js', () => ({ isUserSessionValid }));
jest.unstable_mockModule('../src/services/userService.js', () => ({ calculateAge }));

const { detectFacialStructure, generateRecommendation } = await import('../src/services/aiService.js');
const { ApiError, ApiErrorCode } = await import('../src/errors/ApiError.js');

const PHOTO = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD';
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
        fetchMock.mockResolvedValue(jsonResponse({ data: 'heart', message: 'ok' }));

        await detectFacialStructure(PHOTO);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe(FACE_URL);
        expect(init?.method).toBe('POST');
        expect(init?.headers).toEqual({
            'Content-Type': 'application/json',
            'X-Internal-Api-Key': AI_API_KEY,
        });
    });

    test('envía el proveedor configurado y la foto en el cuerpo', async () => {
        fetchMock.mockResolvedValue(jsonResponse({ data: 'oval', message: 'ok' }));

        await detectFacialStructure(PHOTO);

        const body = sentBody();
        expect(body.provider).toBe(AI_PROVIDER);
        expect(JSON.stringify(body.data)).toContain(PHOTO);
    });

    test('devuelve la respuesta JSON del microservicio sin modificarla', async () => {
        const aiResponse = { data: 'round', message: 'Facial structure classified successfully' };
        fetchMock.mockResolvedValue(jsonResponse(aiResponse));

        await expect(detectFacialStructure(PHOTO)).resolves.toEqual(aiResponse);
    });

    test('lanza ApiError 500 cuando no se puede contactar al microservicio', async () => {
        fetchMock.mockRejectedValue(new TypeError('fetch failed'));

        const error = await detectFacialStructure(PHOTO).catch((e: unknown) => e);

        expect(error).toBeInstanceOf(ApiError);
        expect((error as InstanceType<typeof ApiError>).code).toBe(ApiErrorCode.INTERNAL_SERVER_ERROR);
        expect((error as Error).message).toMatch(/network error/i);
    });

    test.each([
        { status: 400, body: { message: 'Request validation failed' } },
        { status: 401, body: { message: 'Invalid or missing API key' } },
        { status: 422, body: { message: 'unprocessable', errors: [{ field: 'photo', detail: 'bad' }] } },
        { status: 503, body: { message: 'Image download timed out' } },
    ])(
        'lanza ApiError 500 con el código $status cuando el microservicio responde con error',
        async ({ status, body }) => {
            fetchMock.mockResolvedValue(jsonResponse(body, status));

            const error = await detectFacialStructure(PHOTO).catch((e: unknown) => e);

            expect(error).toBeInstanceOf(ApiError);
            expect((error as InstanceType<typeof ApiError>).code).toBe(ApiErrorCode.INTERNAL_SERVER_ERROR);
            expect((error as Error).message).toContain(String(status));
        }
    );
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

    const params = { photo: PHOTO } as Parameters<typeof generateRecommendation>[0];

    test('no llama a la detección si el cliente ya tiene estructura facial', async () => {
        getClientByUserId.mockResolvedValue({ user_id: 'user-1', facial_structure_type: 'square' });
        fetchMock.mockResolvedValue(jsonResponse({ data: { haircuts: [] }, message: 'ok' }));

        await generateRecommendation(params, TOKEN);

        expect(calledUrls()).toEqual([RECOMMEND_URL]);
        expect(getActiveHaircutStylesByFacialStructure).toHaveBeenCalledWith('square');
    });

    test('detecta la estructura facial antes de recomendar si el cliente no la tiene', async () => {
        getClientByUserId.mockResolvedValue({ user_id: 'user-1', facial_structure_type: null });
        fetchMock
            .mockResolvedValueOnce(jsonResponse({ data: 'heart', message: 'ok' }))
            .mockResolvedValueOnce(jsonResponse({ data: { haircuts: [] }, message: 'ok' }));

        await generateRecommendation(params, TOKEN);

        expect(calledUrls()).toEqual([FACE_URL, RECOMMEND_URL]);
        expect(getActiveHaircutStylesByFacialStructure).toHaveBeenCalledWith('heart');
    });

    test('lanza ApiError 500 si la detección no devuelve una estructura facial', async () => {
        getClientByUserId.mockResolvedValue({ user_id: 'user-1', facial_structure_type: null });
        fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'no data' }));

        const error = await generateRecommendation(params, TOKEN).catch((e: unknown) => e);

        expect(error).toBeInstanceOf(ApiError);
        expect((error as InstanceType<typeof ApiError>).code).toBe(ApiErrorCode.INTERNAL_SERVER_ERROR);
        expect(calledUrls()).toEqual([FACE_URL]);
    });
});
