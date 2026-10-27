import type { Supply, SupplyPayload, SupplyShop } from '../types/supplyType';
import {
    mockCreateSupply,
    mockDeleteSupply,
    mockListSupplies,
    mockListSupplyShops,
    mockUpdateSupply
} from '../mocks/supplyMock';

/*
 * Servicio de insumos.
 * Hoy responde con datos mock. Para integrar con el backend solo cambia el cuerpo de estas funciones
 * (usando apiClient y el token); los contenedores no se tocan:
 *
 *   getSupplies    -> GET    /supplies         (acepta ?shopId=; requiere token)
 *   createSupply   -> POST   /supplies
 *   updateSupply   -> PUT    /supplies/:id
 *   deleteSupply   -> DELETE /supplies/:id     (borrado físico: también elimina sus existencias y movimientos)
 *   getSupplyShops -> GET    /shops            (público)
 *
 * Detalles del backend a tener en cuenta:
 *   - Devuelve los insumos tal como salen de la BD (snake_case: shop_id, category_id, created_at...);
 *     hay que convertirlos a camelCase para que coincidan con el tipo Supply.
 *   - Hoy solo el rol manager tiene permiso en /supplies y /suppliesCategories (userPermissions.ts);
 *     el issue pide también recepcionista, así que el backend debe abrir ese permiso.
 *   - Los errores 409 llegan en inglés ('Supply name is already in use in this shop', 'SKU is already in use...');
 *     utils/supplyUtils.ts ya los traduce.
 */

export const getSupplies = async (_token: string): Promise<Supply[]> => mockListSupplies();

export const createSupply = async (payload: SupplyPayload, _token: string): Promise<Supply> =>
    mockCreateSupply(payload);

export const updateSupply = async (id: string, payload: SupplyPayload, _token: string): Promise<Supply> =>
    mockUpdateSupply(id, payload);

export const deleteSupply = async (id: string, _token: string): Promise<void> => mockDeleteSupply(id);

/* Sucursales para el formulario y los filtros. */
export const getSupplyShops = async (): Promise<SupplyShop[]> => mockListSupplyShops();
