import { jest } from '@jest/globals';

// ESM: los mocks deben registrarse antes de importar dinámicamente el servicio.
const getAllShifts = jest.fn<(...args: any[]) => Promise<any>>();
const getShiftById = jest.fn<(...args: any[]) => Promise<any>>();
const getShiftByName = jest.fn<(...args: any[]) => Promise<any>>();
const getShiftByTimes = jest.fn<(...args: any[]) => Promise<any>>();
const createShift = jest.fn<(...args: any[]) => Promise<any>>();
const updateShift = jest.fn<(...args: any[]) => Promise<any>>();
const deleteShiftIfAllowed = jest.fn<(...args: any[]) => Promise<any>>();
const isUserActive = jest.fn<(...args: any[]) => Promise<boolean>>();
const decodeToken = jest.fn<(...args: any[]) => any>();

jest.unstable_mockModule('../src/repositories/shiftRepository.js', () => ({
    getAllShifts,
    getShiftById,
    getShiftByName,
    getShiftByTimes,
    createShift,
    updateShift,
    deleteShiftIfAllowed,
}));
jest.unstable_mockModule('../src/repositories/userRepository.js', () => ({ isUserActive }));
jest.unstable_mockModule('../src/services/jwtTokenService.js', () => ({ decodeToken }));

const { removeShift } = await import('../src/services/shiftService.js');
const { ApiError, ApiErrorCode } = await import('../src/errors/ApiError.js');

describe('shiftService.removeShift', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        decodeToken.mockReturnValue({ id: 'manager-1', role: 'manager' });
        isUserActive.mockResolvedValue(true);
    });

    test('Resuelve cuando el repositorio borra el turno', async () => {
        deleteShiftIfAllowed.mockResolvedValue('deleted');
        await expect(removeShift('shift-1', 'token')).resolves.toBeUndefined();
        expect(deleteShiftIfAllowed).toHaveBeenCalledWith('shift-1');
    });

    test('Si es el único turno existente responde 409', async () => {
        deleteShiftIfAllowed.mockResolvedValue('last_shift');
        await expect(removeShift('shift-1', 'token')).rejects.toMatchObject({
            code: ApiErrorCode.CONFLICT,
            message: expect.stringContaining('only existing shift'),
        });
    });

    test('Si tiene personal asignado responde 409', async () => {
        deleteShiftIfAllowed.mockResolvedValue('has_staff');
        await expect(removeShift('shift-1', 'token')).rejects.toMatchObject({ code: ApiErrorCode.CONFLICT });
    });

    test('Si no existe responde 404', async () => {
        deleteShiftIfAllowed.mockResolvedValue('not_found');
        await expect(removeShift('shift-1', 'token')).rejects.toMatchObject({ code: ApiErrorCode.NOT_FOUND });
    });

    test('Un recepcionista no llega al repositorio (403)', async () => {
        decodeToken.mockReturnValue({ id: 'rec-1', role: 'receptionist' });
        await expect(removeShift('shift-1', 'token')).rejects.toBeInstanceOf(ApiError);
        expect(deleteShiftIfAllowed).not.toHaveBeenCalled();
    });
});
