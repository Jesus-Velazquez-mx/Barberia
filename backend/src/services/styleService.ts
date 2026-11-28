import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import {
    createStyle,
    getFacialStructureTypes,
    getStyleById,
    getStyleNames,
    getStyles,
    softDeleteStyle,
    updateStyle,
    type CreateHaircutStyleInput,
    type HaircutStyleFilters,
    type UpdateHaircutStyleInput,
} from '../repositories/styleRepository.js';
import type { HaircutStyleResponse } from '../types/dto/haircutStyleResponse.interface.js';
import type { FacialStructureType } from '../types/entities/client.interface.js';
import { toHaircutStyleResponse } from '../utils/haircutStyleMapper.js';
import { toSnakeCase } from '../utils/photoKey.js';
import { isUserSessionValid } from '../utils/userSession.js';
import { moveHaircutPhoto } from './bucketService.js';
import { canManageHaircutStyles } from './userPermissions.js';

const NAME_IN_USE_MESSAGE = 'Haircut style name is already in use';
const PG_UNIQUE_VIOLATION = '23505';

/** Valida la sesión y que quien la usa pueda administrar el catálogo de estilos. */
const assertCanManage = async (token: string, action: string): Promise<void> => {
    const performer = await isUserSessionValid(token);

    if (!canManageHaircutStyles(performer)) {
        throw new ApiError(ApiErrorCode.FORBIDDEN, `Not authorized to ${action} haircut styles`);
    }
};

/*
 * Dos nombres chocan si coinciden en snake_case: así se ignoran mayúsculas, acentos y signos, y además se
 * garantiza que no compartan la key de su foto en el bucket (que se deriva del nombre en snake_case).
 */
const assertNameAvailable = async (name: string, excludeId?: string): Promise<void> => {
    const normalized = toSnakeCase(name);
    const styles = await getStyleNames();

    if (styles.some((style) => style.id !== excludeId && toSnakeCase(style.name) === normalized)) {
        throw new ApiError(ApiErrorCode.CONFLICT, NAME_IN_USE_MESSAGE);
    }
};

/* Si otra petición registró el mismo nombre entre la validación y el INSERT, la BD responde unique_violation. */
const rethrowUniqueViolation = (error: unknown): never => {
    if ((error as { code?: string })?.code === PG_UNIQUE_VIOLATION) {
        throw new ApiError(ApiErrorCode.CONFLICT, NAME_IN_USE_MESSAGE);
    }
    throw error;
};

/**
 * Lista los estilos de corte (activos e inactivos), con búsqueda opcional por nombre o descripción.
 */
export const listStyles = async (filters: HaircutStyleFilters, token: string): Promise<HaircutStyleResponse[]> => {
    await assertCanManage(token, 'view');

    const styles = await getStyles(filters);
    return styles.map(toHaircutStyleResponse);
};

/**
 * Obtiene un estilo de corte por su ID.
 */
export const getStyle = async (id: string, token: string): Promise<HaircutStyleResponse> => {
    await assertCanManage(token, 'view');

    const style = await getStyleById(id);
    if (!style) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Haircut style not found');
    }

    return toHaircutStyleResponse(style);
};

/**
 * Valores válidos de estructura facial, tal como están definidos en la base de datos.
 */
export const listFacialStructures = async (token: string): Promise<FacialStructureType[]> => {
    await assertCanManage(token, 'view');

    return getFacialStructureTypes();
};

/**
 * Registra un estilo de corte. El nombre no puede repetirse (ver assertNameAvailable).
 */
export const registerStyle = async (data: CreateHaircutStyleInput, token: string): Promise<HaircutStyleResponse> => {
    await assertCanManage(token, 'create');
    await assertNameAvailable(data.name);

    const style = await createStyle(data).catch(rethrowUniqueViolation);
    return toHaircutStyleResponse(style);
};

/**
 * Actualiza un estilo de corte. Si cambia el nombre, la foto del bucket se mueve a la key nueva dentro
 * de la misma transacción: si S3 falla, el cambio no se guarda.
 */
export const editStyle = async (
    id: string,
    data: UpdateHaircutStyleInput,
    token: string
): Promise<HaircutStyleResponse> => {
    await assertCanManage(token, 'update');

    const current = await getStyleById(id);
    if (!current) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Haircut style not found');
    }

    const newName = data.name;
    const renamesPhoto = newName !== undefined && toSnakeCase(newName) !== toSnakeCase(current.name);

    if (renamesPhoto) {
        await assertNameAvailable(newName, id);
    }

    const beforeCommit = renamesPhoto ? () => moveHaircutPhoto(current.name, newName) : undefined;

    const style = await updateStyle(id, data, beforeCommit).catch(rethrowUniqueViolation);
    return toHaircutStyleResponse(style);
};

/**
 * Da de baja un estilo de corte (borrado lógico: queda inactivo y se puede reactivar al editarlo).
 */
export const removeStyle = async (id: string, token: string): Promise<void> => {
    await assertCanManage(token, 'delete');

    await softDeleteStyle(id);
};
