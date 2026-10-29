import { MOCK_MANAGERS, MOCK_SHOPS } from '../mocks/shopMocks';
import type { ShopPayload, ShopRecord } from '../types/shopType';

/* Servicio con mock data para la administración de sucursales: no llama a la API. Vive en su propio
   archivo para no mezclarse con services/shopService.ts, que usa el flujo de agendar cita. */

let shops: ShopRecord[] = MOCK_SHOPS.map((shop) => ({ ...shop }));

const delay = (ms = 350) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const getManagerName = (managerId: string): string | null =>
  MOCK_MANAGERS.find((manager) => manager.value === managerId)?.label ?? null;

const validatePayload = (payload: ShopPayload, ignoreId?: string): string | null => {
  const name = payload.name.trim().toLowerCase();

  if (shops.some((shop) => shop.id !== ignoreId && shop.name.trim().toLowerCase() === name)) {
    return 'Ya existe una sucursal con ese nombre.';
  }
  if (!getManagerName(payload.managerId)) return 'El gerente seleccionado no existe.';
  return null;
};

export async function getShops(): Promise<ShopRecord[]> {
  await delay();
  return shops.filter((shop) => shop.isActive).map((shop) => ({ ...shop }));
}

export async function createShop(payload: ShopPayload): Promise<ShopRecord> {
  await delay();

  const problem = validatePayload(payload);
  if (problem) throw new Error(problem);

  const created: ShopRecord = {
    id: crypto.randomUUID(),
    ...payload,
    managerName: getManagerName(payload.managerId) ?? '',
    isActive: true
  };
  shops = [created, ...shops];
  return { ...created };
}

export async function updateShop(id: string, payload: ShopPayload): Promise<ShopRecord> {
  await delay();

  const current = shops.find((shop) => shop.id === id);
  if (!current) throw new Error('No encontramos la sucursal.');

  const problem = validatePayload(payload, id);
  if (problem) throw new Error(problem);

  const updated: ShopRecord = { ...current, ...payload, managerName: getManagerName(payload.managerId) ?? '' };
  shops = shops.map((shop) => (shop.id === id ? updated : shop));
  return { ...updated };
}

/* Baja lógica: is_active = false. La sucursal deja de aparecer en el listado. */
export async function deleteShop(shop: ShopRecord): Promise<void> {
  await delay();

  const current = shops.find((item) => item.id === shop.id);
  if (!current) throw new Error('No encontramos la sucursal.');

  shops = shops.map((item) => (item.id === shop.id ? { ...item, isActive: false } : item));
}