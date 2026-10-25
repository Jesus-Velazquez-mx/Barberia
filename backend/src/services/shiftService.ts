import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import {
    getAllShifts,
    getShiftById,
    getShiftByName,
    getShiftByTimes,
    createShift as repoCreateShift,
    updateShift as repoUpdateShift,
    deleteShiftIfAllowed,
    type CreateShiftInput,
    type UpdateShiftInput,
} from '../repositories/shiftRepository.js';
import { isUserActive } from '../repositories/userRepository.js';
import { decodeToken } from './jwtTokenService.js';
import { canManageShifts, canViewShifts, type UserIdentity } from './userPermissions.js';
import { timeToMinutes } from '../utils/businessTime.js';
import type { Shift } from '../types/entities/shift.interface.js';

/** Duraciones permitidas para un turno, en horas. */
export const ALLOWED_SHIFT_HOURS = [4, 6, 8];

/**
 * Decodifica el token y exige que el usuario tenga el permiso indicado y una cuenta activa.
 */
const authorize = async (
    token: string,
    isAllowed: (performer: UserIdentity) => boolean,
    forbiddenMessage: string
): Promise<void> => {
    const performer = decodeToken(token);

    if (!isAllowed(performer)) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, forbiddenMessage);
    }

    if (!(await isUserActive(performer.id))) {
        throw new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, 'Account is deactivated');
    }
};

/**
 * Valida que el fin sea posterior al inicio y que la duración sea de 4, 6 u 8 horas.
 */
const assertValidTimeRange = (startTime: string, endTime: string): void => {
    const minutes = timeToMinutes(endTime) - timeToMinutes(startTime);

    if (minutes <= 0) {
        throw new ApiError(ApiErrorCode.INVALID_INPUT, 'Shift end time must be after its start time');
    }

    if (!ALLOWED_SHIFT_HOURS.some((hours) => hours * 60 === minutes)) {
        throw new ApiError(ApiErrorCode.INVALID_INPUT, `Shift length must be ${ALLOWED_SHIFT_HOURS.join(', ')} hours`);
    }
};

const assertNameAvailable = async (name: string, ownId?: string): Promise<void> => {
    const existing = await getShiftByName(name);
    if (existing && existing.id !== ownId) {
        throw new ApiError(ApiErrorCode.CONFLICT, 'Shift name is already in use');
    }
};

const assertTimesAvailable = async (startTime: string, endTime: string, ownId?: string): Promise<void> => {
    const existing = await getShiftByTimes(startTime, endTime);
    if (existing && existing.id !== ownId) {
        throw new ApiError(ApiErrorCode.CONFLICT, 'Another shift already has this exact start and end time');
    }
};

/**
 * Código 23505 de PostgreSQL: violación de UNIQUE (carrera entre la verificación previa y la escritura).
 */
const translateUniqueViolation = (error: unknown): never => {
    if ((error as { code?: string }).code === '23505') {
        throw new ApiError(ApiErrorCode.CONFLICT, 'Shift name or time range is already in use');
    }
    throw error;
};

/**
 * Recupera todos los turnos.
 * Requiere rol de manager o recepcionista y cuenta activa.
 */
export const listShifts = async (token: string): Promise<Shift[]> => {
    await authorize(token, canViewShifts, 'Not authorized to view shifts');
    return await getAllShifts();
};

/**
 * Obtiene un turno por su ID.
 * Requiere rol de manager o recepcionista y cuenta activa.
 * Lanza un error 404 si el turno no existe.
 */
export const getShift = async (id: string, token: string): Promise<Shift> => {
    await authorize(token, canViewShifts, 'Not authorized to view shifts');

    const shift = await getShiftById(id);
    if (!shift) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Shift not found');
    }
    return shift;
};

/**
 * Registra un nuevo turno.
 * Requiere rol de manager y cuenta activa.
 * Valida la duración (4, 6 u 8 horas), que el nombre no esté en uso y que no exista otro turno con el mismo horario.
 */
export const registerShift = async (data: CreateShiftInput, token: string): Promise<Shift> => {
    await authorize(token, canManageShifts, 'Not authorized to create shifts');

    assertValidTimeRange(data.start_time, data.end_time);
    await assertNameAvailable(data.name);
    await assertTimesAvailable(data.start_time, data.end_time);

    try {
        return await repoCreateShift(data);
    } catch (error: unknown) {
        return translateUniqueViolation(error);
    }
};

/**
 * Edita un turno existente.
 * Requiere rol de manager y cuenta activa.
 * Las validaciones de duración y horario duplicado se aplican sobre los valores resultantes
 * (los actuales combinados con los enviados), ignorando al propio turno.
 */
export const editShift = async (id: string, data: UpdateShiftInput, token: string): Promise<Shift> => {
    await authorize(token, canManageShifts, 'Not authorized to update shifts');

    const shift = await getShiftById(id);
    if (!shift) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Shift not found');
    }

    const startTime = data.start_time ?? shift.start_time;
    const endTime = data.end_time ?? shift.end_time;

    assertValidTimeRange(startTime, endTime);

    if (data.name !== undefined) {
        await assertNameAvailable(data.name, id);
    }
    if (data.start_time !== undefined || data.end_time !== undefined) {
        await assertTimesAvailable(startTime, endTime, id);
    }

    try {
        return await repoUpdateShift(id, data);
    } catch (error: unknown) {
        return translateUniqueViolation(error);
    }
};

/**
 * Elimina físicamente un turno.
 * Requiere rol de manager y cuenta activa.
 * No se puede eliminar si es el único turno existente ni si tiene personal (barberos o recepcionistas) asignado.
 */
export const removeShift = async (id: string, token: string): Promise<void> => {
    await authorize(token, canManageShifts, 'Not authorized to delete shifts');

    const result = await deleteShiftIfAllowed(id);

    switch (result) {
        case 'not_found':
            throw new ApiError(ApiErrorCode.NOT_FOUND, 'Shift not found');
        case 'last_shift':
            throw new ApiError(
                ApiErrorCode.CONFLICT,
                'Cannot delete the only existing shift; create another shift first'
            );
        case 'has_staff':
            throw new ApiError(ApiErrorCode.CONFLICT, 'Cannot delete shift because it has staff assigned');
        case 'deleted':
            return;
    }
};
