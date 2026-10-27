// Datos mock SOLO para la vista de suministros (sin backend).
// Se elimina cuando el servicio de suministros use /supplies (ver services/supplyService.ts).
import { ApiError } from '../types/api';
import type { SupplyCategory } from '../types/supplyCategoryType';
import type { Supply, SupplyPayload, SupplyShop } from '../types/supplyType';
import { normalizeText } from '../utils/listUtils';
import { MOCK_SHOP_OPTIONS } from './adminMock';

/* ---------- Catálogos (mock) ---------- */

/* Mismas sucursales que usa el dashboard del manager en sus otros mocks. */
const SHOPS: SupplyShop[] = MOCK_SHOP_OPTIONS.map((option) => ({ id: option.value, name: option.label }));

const SEED_DATE = '2026-10-01T16:00:00.000Z';

const CATEGORIES: SupplyCategory[] = [
    {
        id: 'cat-tools',
        name: 'Herramientas',
        description: 'Equipo reutilizable.',
        createdAt: SEED_DATE,
        updatedAt: SEED_DATE
    },
    {
        id: 'cat-hair',
        name: 'Productos para el cabello',
        description: 'Shampoos, acondicionadores y productos de peinado.',
        createdAt: SEED_DATE,
        updatedAt: SEED_DATE
    },
    {
        id: 'cat-disposables',
        name: 'Desechables',
        description: 'Consumibles de un solo uso.',
        createdAt: SEED_DATE,
        updatedAt: SEED_DATE
    },
    {
        id: 'cat-cleaning',
        name: 'Limpieza y sanitización',
        description: 'Desinfectantes y artículos de limpieza.',
        createdAt: SEED_DATE,
        updatedAt: SEED_DATE
    }
];

/* ---------- Datos iniciales ---------- */

type SupplySeed = [
    name: string,
    categoryId: string,
    unit: string,
    skuSuffix: string | null,
    description: string | null
];

/* Los mismos insumos se registran en cada sucursal, con SKU propio (prefijo de la sucursal). */
const SUPPLY_SEED: SupplySeed[] = [
    ['Tijeras profesionales', 'cat-tools', 'pieza', 'SCI-001', 'Tijeras de acero inoxidable para corte.'],
    ['Máquina de corte', 'cat-tools', 'pieza', 'CLP-001', 'Máquina inalámbrica con juego de peines.'],
    ['Shampoo NERV', 'cat-hair', 'botella', 'SHM-001', 'Shampoo de la casa.'],
    ['Cera para peinar', 'cat-hair', 'frasco', 'WAX-001', null],
    ['Navajas desechables', 'cat-disposables', 'caja', 'RAZ-001', 'Hojas de navaja de un solo uso.'],
    ['Capas desechables', 'cat-disposables', 'paquete', null, 'Capas de papel para cliente.'],
    [
        'Desinfectante para herramientas',
        'cat-cleaning',
        'litro',
        'DES-001',
        'Barbicida para sanitizar peines y tijeras.'
    ]
];

const SHOP_PREFIXES: Record<string, string> = { 'shop-1': 'SEN', 'shop-2': 'EXP' };

let nextId = 1;
const createId = () => `supply-${nextId++}`;

const buildSeed = (): Supply[] =>
    SHOPS.flatMap((shop, shopIndex) =>
        SUPPLY_SEED.map(([name, categoryId, unit, skuSuffix, description], supplyIndex) => {
            /* Fechas escalonadas para que "más reciente primero" tenga sentido. */
            const date = new Date(Date.UTC(2026, 9, 1 + shopIndex, 16, supplyIndex)).toISOString();

            return {
                id: createId(),
                shopId: shop.id,
                categoryId,
                name,
                description,
                unit,
                sku: skuSuffix ? `${SHOP_PREFIXES[shop.id] ?? 'GEN'}-${skuSuffix}` : null,
                createdAt: date,
                updatedAt: date
            };
        })
    );

/* Estado en memoria: los cambios persisten mientras no se recargue la página. */
let supplyStore: Supply[] = buildSeed();

/* ---------- Operaciones (mock) ---------- */

const wait = (ms = 350) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/* Mismas reglas que el backend: nombre y SKU únicos dentro de la misma sucursal; sucursal y categoría existentes. */
function assertValid(payload: SupplyPayload, ignoreId?: string) {
    if (!SHOPS.some((shop) => shop.id === payload.shopId)) throw new ApiError('Sucursal no encontrada.', 404);
    if (!CATEGORIES.some((category) => category.id === payload.categoryId)) {
        throw new ApiError('Categoría no encontrada.', 404);
    }

    const sameShop = supplyStore.filter((supply) => supply.shopId === payload.shopId && supply.id !== ignoreId);

    if (sameShop.some((supply) => normalizeText(supply.name) === normalizeText(payload.name))) {
        throw new ApiError('Ya existe un suministro con ese nombre en esta sucursal.', 409);
    }
    if (payload.sku && sameShop.some((supply) => supply.sku === payload.sku)) {
        throw new ApiError('Este SKU ya está en uso en esta sucursal.', 409);
    }
}

export async function mockListSupplyShops(): Promise<SupplyShop[]> {
    await wait();
    return SHOPS;
}

export async function mockListSupplyCategories(): Promise<SupplyCategory[]> {
    await wait();
    return CATEGORIES;
}

export async function mockListSupplies(): Promise<Supply[]> {
    await wait();
    /* Más recientes primero, igual que quedan las altas nuevas en la tabla. */
    return [...supplyStore].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function mockCreateSupply(payload: SupplyPayload): Promise<Supply> {
    await wait();
    assertValid(payload);

    const now = new Date().toISOString();
    const supply: Supply = { id: createId(), ...payload, createdAt: now, updatedAt: now };
    supplyStore = [supply, ...supplyStore];
    return supply;
}

export async function mockUpdateSupply(id: string, payload: SupplyPayload): Promise<Supply> {
    await wait();

    const current = supplyStore.find((supply) => supply.id === id);
    if (!current) throw new ApiError('Suministro no encontrado.', 404);
    assertValid(payload, id);

    const updated: Supply = { ...current, ...payload, updatedAt: new Date().toISOString() };
    supplyStore = supplyStore.map((supply) => (supply.id === id ? updated : supply));
    return updated;
}

export async function mockDeleteSupply(id: string): Promise<void> {
    await wait();
    if (!supplyStore.some((supply) => supply.id === id)) throw new ApiError('Suministro no encontrado.', 404);
    supplyStore = supplyStore.filter((supply) => supply.id !== id);
}
