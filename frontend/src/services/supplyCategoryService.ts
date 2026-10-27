import type { SupplyCategory, SupplyCategoryPayload } from '../types/supplyCategoryType';
import {
    mockCreateSupplyCategory,
    mockDeleteSupplyCategory,
    mockListSupplyCategories,
    mockUpdateSupplyCategory
} from '../mocks/supplyMock';

/*
 * Servicio de categorías de insumos.
 * Hoy responde con datos mock. Para integrar con el backend solo cambia el cuerpo de estas funciones
 * (usando apiClient y el token); los contenedores no se tocan:
 *
 *   getSupplyCategories    -> GET    /suppliesCategories
 *   createSupplyCategory   -> POST   /suppliesCategories
 *   updateSupplyCategory   -> PUT    /suppliesCategories/:id
 *   deleteSupplyCategory   -> DELETE /suppliesCategories/:id   (400 si la categoría tiene suministros asignados)
 *
 * Detalles del backend a tener en cuenta:
 *   - Devuelve las filas tal como salen de la BD (snake_case: created_at, updated_at); hay que convertirlas
 *     a camelCase para que coincidan con el tipo SupplyCategory.
 *   - Hoy solo el rol manager tiene permiso (userPermissions.ts); el issue pide también recepcionista,
 *     así que el backend debe abrir ese permiso.
 *   - Los errores llegan en inglés ('Category name is already in use', 'Cannot delete category because it has
 *     supplies assigned'); utils/supplyUtils.ts ya los traduce.
 */

export const getSupplyCategories = async (_token: string): Promise<SupplyCategory[]> => mockListSupplyCategories();

export const createSupplyCategory = async (payload: SupplyCategoryPayload, _token: string): Promise<SupplyCategory> =>
    mockCreateSupplyCategory(payload);

export const updateSupplyCategory = async (
    id: string,
    payload: SupplyCategoryPayload,
    _token: string
): Promise<SupplyCategory> => mockUpdateSupplyCategory(id, payload);

export const deleteSupplyCategory = async (id: string, _token: string): Promise<void> => mockDeleteSupplyCategory(id);
