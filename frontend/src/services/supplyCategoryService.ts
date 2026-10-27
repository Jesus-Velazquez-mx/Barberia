import type { SupplyCategory } from '../types/supplyCategoryType';
import { mockListSupplyCategories } from '../mocks/supplyMock';

/*
 * Servicio de categorías de insumos. Hoy solo expone el listado (lo usa el formulario y los filtros de insumos)
 * y responde con datos mock. Para integrar con el backend solo cambia el cuerpo de la función:
 *
 *   getSupplyCategories -> GET /suppliesCategories   (requiere token; hoy solo el rol manager tiene permiso)
 *
 * El backend devuelve las filas tal como salen de la BD (snake_case: created_at, updated_at);
 * hay que convertirlas a camelCase para que coincidan con el tipo SupplyCategory.
 */

export const getSupplyCategories = async (_token: string): Promise<SupplyCategory[]> => mockListSupplyCategories();
