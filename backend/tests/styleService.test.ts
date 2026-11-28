import { jest } from '@jest/globals';

/*
 * Pruebas unitarias de src/services/styleService.ts. El repositorio, el bucket y la sesión se reemplazan por mocks.
 */

const getStyles = jest.fn<(...args: any[]) => Promise<any>>();
const getStyleById = jest.fn<(...args: any[]) => Promise<any>>();
const getStyleNames = jest.fn<(...args: any[]) => Promise<any>>();
const getFacialStructureTypes = jest.fn<(...args: any[]) => Promise<any>>();
const createStyle = jest.fn<(...args: any[]) => Promise<any>>();
const updateStyle = jest.fn<(...args: any[]) => Promise<any>>();
const softDeleteStyle = jest.fn<(...args: any[]) => Promise<void>>();
const moveHaircutPhoto = jest.fn<(...args: any[]) => Promise<void>>();
const isUserSessionValid = jest.fn<(...args: any[]) => Promise<any>>();

jest.unstable_mockModule('../src/config/globalConfig.js', () => ({
    default: { AWS_BUCKET_KEY_PREFIX_USER: 'user/images/', AWS_BUCKET_KEY_PREFIX_HAIRCUTS: 'haircuts/' },
}));
jest.unstable_mockModule('../src/repositories/styleRepository.js', () => ({
    getStyles,
    getStyleById,
    getStyleNames,
    getFacialStructureTypes,
    createStyle,
    updateStyle,
    softDeleteStyle,
}));
jest.unstable_mockModule('../src/services/bucketService.js', () => ({ moveHaircutPhoto }));
jest.unstable_mockModule('../src/utils/userSession.js', () => ({ isUserSessionValid }));

const { listStyles, getStyle, listFacialStructures, registerStyle, editStyle, removeStyle } =
    await import('../src/services/styleService.js');
const { ApiError, ApiErrorCode } = await import('../src/errors/ApiError.js');

const createdAt = new Date('2026-01-01T00:00:00Z');

const wolfCutRow = {
    id: 'style-1',
    name: 'Wolf Cut',
    description: 'Capas desfiladas',
    is_active: true,
    facial_structures: ['oval', 'square'],
    created_at: createdAt,
    updated_at: createdAt,
};

const wolfCutResponse = {
    id: 'style-1',
    name: 'Wolf Cut',
    description: 'Capas desfiladas',
    isActive: true,
    facialStructures: ['oval', 'square'],
    createdAt,
    updatedAt: createdAt,
};

beforeEach(() => {
    jest.resetAllMocks();
    isUserSessionValid.mockResolvedValue({ id: 'manager-1', role: 'manager' });
    getStyleNames.mockResolvedValue([
        { id: 'style-1', name: 'Wolf Cut' },
        { id: 'style-2', name: 'Buzz Cut' },
    ]);
    getStyleById.mockResolvedValue(wolfCutRow);
    // Ejecuta el callback como lo haría el repositorio (antes del COMMIT)
    updateStyle.mockImplementation(async (_id, _data, beforeCommit?: () => Promise<void>) => {
        if (beforeCommit) await beforeCommit();
        return wolfCutRow;
    });
});

describe('autorización', () => {
    test.each(['client', 'receptionist', 'barber'])('rechaza al rol %s con 403 sin tocar la BD', async (role) => {
        isUserSessionValid.mockResolvedValue({ id: 'user-1', role });

        const calls = [
            () => listStyles({}, 'token'),
            () => getStyle('style-1', 'token'),
            () => listFacialStructures('token'),
            () => registerStyle({ name: 'Nuevo', facialStructures: ['oval'] }, 'token'),
            () => editStyle('style-1', { name: 'Nuevo' }, 'token'),
            () => removeStyle('style-1', 'token'),
        ];

        for (const call of calls) {
            await expect(call()).rejects.toMatchObject({ code: ApiErrorCode.FORBIDDEN });
        }

        expect(getStyles).not.toHaveBeenCalled();
        expect(createStyle).not.toHaveBeenCalled();
        expect(updateStyle).not.toHaveBeenCalled();
        expect(softDeleteStyle).not.toHaveBeenCalled();
    });

    test('propaga el error de sesión (cuenta desactivada)', async () => {
        isUserSessionValid.mockRejectedValue(new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated'));

        await expect(listStyles({}, 'token')).rejects.toThrow('Account is deactivated');
    });
});

describe('listStyles / getStyle / listFacialStructures', () => {
    test('lista los estilos con los filtros recibidos y los devuelve en camelCase', async () => {
        getStyles.mockResolvedValue([wolfCutRow]);

        await expect(listStyles({ search: 'wolf', isActive: true }, 'token')).resolves.toEqual([wolfCutResponse]);

        expect(getStyles).toHaveBeenCalledWith({ search: 'wolf', isActive: true });
    });

    test('devuelve un arreglo vacío cuando el catálogo está vacío', async () => {
        getStyles.mockResolvedValue([]);

        await expect(listStyles({}, 'token')).resolves.toEqual([]);
    });

    test('getStyle responde 404 si el estilo no existe', async () => {
        getStyleById.mockResolvedValue(null);

        await expect(getStyle('missing', 'token')).rejects.toMatchObject({
            code: ApiErrorCode.NOT_FOUND,
            message: 'Haircut style not found',
        });
    });

    test('listFacialStructures devuelve los valores del enum de la BD', async () => {
        getFacialStructureTypes.mockResolvedValue(['oval', 'round']);

        await expect(listFacialStructures('token')).resolves.toEqual(['oval', 'round']);
    });
});

describe('registerStyle', () => {
    test('registra el estilo cuando el nombre está disponible', async () => {
        createStyle.mockResolvedValue({ ...wolfCutRow, id: 'style-3', name: 'Mullet' });
        const data = { name: 'Mullet', description: null, facialStructures: ['oval' as const] };

        await expect(registerStyle(data, 'token')).resolves.toMatchObject({ id: 'style-3', name: 'Mullet' });

        expect(createStyle).toHaveBeenCalledWith(data);
    });

    test.each(['Wolf Cut', 'wolf cut', 'WOLF-CUT', '  Wólf   Cut '])(
        'responde 409 si "%s" coincide en snake_case con otro estilo',
        async (name) => {
            await expect(registerStyle({ name, facialStructures: ['oval'] }, 'token')).rejects.toMatchObject({
                code: ApiErrorCode.CONFLICT,
                message: 'Haircut style name is already in use',
            });

            expect(createStyle).not.toHaveBeenCalled();
        }
    );

    test('convierte la violación de unicidad de la BD (carrera) en 409', async () => {
        createStyle.mockRejectedValue(Object.assign(new Error('duplicate key'), { code: '23505' }));

        await expect(registerStyle({ name: 'Mullet', facialStructures: ['oval'] }, 'token')).rejects.toMatchObject({
            code: ApiErrorCode.CONFLICT,
        });
    });

    test('propaga otros errores de la BD', async () => {
        createStyle.mockRejectedValue(new Error('connection lost'));

        await expect(registerStyle({ name: 'Mullet', facialStructures: ['oval'] }, 'token')).rejects.toThrow(
            'connection lost'
        );
    });
});

describe('editStyle', () => {
    test('responde 404 si el estilo no existe', async () => {
        getStyleById.mockResolvedValue(null);

        await expect(editStyle('missing', { isActive: false }, 'token')).rejects.toMatchObject({
            code: ApiErrorCode.NOT_FOUND,
        });

        expect(updateStyle).not.toHaveBeenCalled();
    });

    test('sin cambio de nombre no valida duplicados ni mueve la foto', async () => {
        const data = { description: 'Nueva', facialStructures: ['heart' as const], isActive: false };

        await expect(editStyle('style-1', data, 'token')).resolves.toEqual(wolfCutResponse);

        expect(updateStyle).toHaveBeenCalledWith('style-1', data, undefined);
        expect(getStyleNames).not.toHaveBeenCalled();
        expect(moveHaircutPhoto).not.toHaveBeenCalled();
    });

    test('un cambio que no altera el snake_case (mayúsculas) no mueve la foto', async () => {
        await editStyle('style-1', { name: 'WOLF CUT' }, 'token');

        expect(moveHaircutPhoto).not.toHaveBeenCalled();
        expect(getStyleNames).not.toHaveBeenCalled();
    });

    test('al renombrar mueve la foto del nombre anterior al nuevo dentro de la transacción', async () => {
        await editStyle('style-1', { name: 'Wolf Cut Largo' }, 'token');

        expect(moveHaircutPhoto).toHaveBeenCalledWith('Wolf Cut', 'Wolf Cut Largo');
        expect(updateStyle).toHaveBeenCalledWith('style-1', { name: 'Wolf Cut Largo' }, expect.any(Function));
    });

    test('responde 409 si el nombre nuevo pertenece a otro estilo', async () => {
        await expect(editStyle('style-1', { name: 'buzz cut' }, 'token')).rejects.toMatchObject({
            code: ApiErrorCode.CONFLICT,
        });

        expect(updateStyle).not.toHaveBeenCalled();
        expect(moveHaircutPhoto).not.toHaveBeenCalled();
    });

    test('si mover la foto falla, el error se propaga (el repositorio hace ROLLBACK)', async () => {
        moveHaircutPhoto.mockRejectedValue(new Error('S3 unavailable'));

        await expect(editStyle('style-1', { name: 'Mullet' }, 'token')).rejects.toThrow('S3 unavailable');
    });
});

describe('removeStyle', () => {
    test('hace el borrado lógico', async () => {
        await expect(removeStyle('style-1', 'token')).resolves.toBeUndefined();

        expect(softDeleteStyle).toHaveBeenCalledWith('style-1');
    });

    test('propaga el 404 del repositorio', async () => {
        softDeleteStyle.mockRejectedValue(new ApiError(ApiErrorCode.NOT_FOUND, 'Haircut style not found'));

        await expect(removeStyle('missing', 'token')).rejects.toMatchObject({ code: ApiErrorCode.NOT_FOUND });
    });
});
