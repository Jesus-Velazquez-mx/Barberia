// Datos mock SOLO para las vistas de servicios ofrecidos y categorías de servicios (sin backend).
// Se elimina cuando los servicios usen /offeredServices y /servicesCategories
// (ver services/offeredServiceService.ts y services/serviceCategoryService.ts).
import { ApiError } from '../types/api';
import type { OfferedService, OfferedServicePayload } from '../types/offeredService';
import type { ServiceCategory, ServiceCategoryPayload } from '../types/serviceCategoryType';
import { normalizeText } from '../utils/listUtils';

const SEED_DATE = '2026-10-01T16:00:00.000Z';

/* ---------- Categorías (mock) ---------- */

/* Estado en memoria: los cambios persisten mientras no se recargue la página. */
let categoryStore: ServiceCategory[] = [
    {
        id: 'svc-cat-haircuts',
        name: 'Cortes de cabello',
        description: 'Cortes clásicos, modernos y personalizados.',
        isActive: true,
        createdAt: SEED_DATE,
        updatedAt: SEED_DATE
    },
    {
        id: 'svc-cat-beard',
        name: 'Barba y afeitado',
        description: 'Perfilado, arreglo y afeitado tradicional con navaja.',
        isActive: true,
        createdAt: SEED_DATE,
        updatedAt: SEED_DATE
    },
    {
        id: 'svc-cat-color',
        name: 'Color',
        description: 'Tintes, matizados y cubrimiento de canas.',
        isActive: true,
        createdAt: SEED_DATE,
        updatedAt: SEED_DATE
    },
    {
        id: 'svc-cat-facial',
        name: 'Cuidado facial',
        description: 'Mascarillas y tratamientos para la piel.',
        isActive: true,
        createdAt: SEED_DATE,
        updatedAt: SEED_DATE
    },
    {
        id: 'svc-cat-kids',
        name: 'Infantil',
        description: 'Servicios para niños menores de 12 años.',
        isActive: false,
        createdAt: SEED_DATE,
        updatedAt: SEED_DATE
    }
];

/* ---------- Servicios (mock) ---------- */

type ServiceSeed = [
    name: string,
    categoryId: string,
    durationMinutes: number,
    price: number,
    description: string | null,
    isActive: boolean
];

const SERVICE_SEED: ServiceSeed[] = [
    ['Corte clásico', 'svc-cat-haircuts', 30, 250, 'Corte tradicional con tijera y máquina.', true],
    ['Corte fade', 'svc-cat-haircuts', 45, 300, 'Degradado a máquina con acabado a navaja.', true],
    ['Corte con diseño', 'svc-cat-haircuts', 60, 350, 'Corte con líneas o figuras personalizadas.', true],
    ['Corte a tijera', 'svc-cat-haircuts', 45, 320, null, false],
    ['Afeitado de barba', 'svc-cat-beard', 30, 200, 'Afeitado clásico con toalla caliente y navaja.', true],
    ['Perfilado de barba', 'svc-cat-beard', 20, 150, 'Delineado y recorte de contornos.', true],
    ['Tinte de cabello', 'svc-cat-color', 90, 650, 'Aplicación de color completo.', true],
    ['Cubrimiento de canas', 'svc-cat-color', 40, 400, null, true],
    ['Mascarilla negra', 'svc-cat-facial', 15, 150, 'Limpieza profunda con carbón activado.', true],
    ['Limpieza facial', 'svc-cat-facial', 40, 380, 'Exfoliación, extracción e hidratación.', true],
    ['Corte infantil', 'svc-cat-kids', 30, 180, 'Corte para niños menores de 12 años.', false]
];

let nextServiceId = 1;
const createServiceId = () => `svc-${nextServiceId++}`;

/* Fechas escalonadas para que "más reciente primero" tenga sentido. */
let serviceStore: OfferedService[] = SERVICE_SEED.map(
    ([name, categoryId, durationMinutes, price, description, isActive], index) => {
        const date = new Date(Date.UTC(2026, 9, 1, 16, index)).toISOString();
        return {
            id: createServiceId(),
            categoryId,
            name,
            description,
            durationMinutes,
            price,
            isActive,
            createdAt: date,
            updatedAt: date
        };
    }
);

/* ---------- Operaciones (mock) ---------- */

const wait = (ms = 350) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/* Desactiva en cascada los servicios de una categoría, como hace el repositorio del backend. */
function deactivateServicesOf(categoryId: string) {
    const now = new Date().toISOString();
    serviceStore = serviceStore.map((service) =>
        service.categoryId === categoryId && service.isActive ? { ...service, isActive: false, updatedAt: now } : service
    );
}

/* Mismas reglas que el backend: nombre único (sin distinguir mayúsculas) y categoría existente. */
function assertServiceValid(payload: OfferedServicePayload, ignoreId?: string) {
    if (!categoryStore.some((category) => category.id === payload.categoryId)) {
        throw new ApiError('Service category not found', 404);
    }
    if (
        serviceStore.some(
            (service) => service.id !== ignoreId && normalizeText(service.name) === normalizeText(payload.name)
        )
    ) {
        throw new ApiError('Service name is already in use', 409);
    }
}

/* GET /offeredServices: manager y recepcionista reciben activos e inactivos. */
export async function mockListOfferedServices(): Promise<OfferedService[]> {
    await wait();
    return [...serviceStore].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function mockCreateOfferedService(payload: OfferedServicePayload): Promise<OfferedService> {
    await wait();
    assertServiceValid(payload);

    const now = new Date().toISOString();
    const service: OfferedService = { id: createServiceId(), ...payload, createdAt: now, updatedAt: now };
    serviceStore = [service, ...serviceStore];
    return service;
}

export async function mockUpdateOfferedService(id: string, payload: OfferedServicePayload): Promise<OfferedService> {
    await wait();

    const current = serviceStore.find((service) => service.id === id);
    if (!current) throw new ApiError('Service not found', 404);
    assertServiceValid(payload, id);

    const updated: OfferedService = { ...current, ...payload, updatedAt: new Date().toISOString() };
    serviceStore = serviceStore.map((service) => (service.id === id ? updated : service));
    return updated;
}

/* DELETE /offeredServices/:id es un borrado lógico: el servicio queda inactivo. */
export async function mockDeleteOfferedService(id: string): Promise<void> {
    await wait();

    const current = serviceStore.find((service) => service.id === id);
    if (!current) throw new ApiError('Service not found', 404);

    serviceStore = serviceStore.map((service) =>
        service.id === id ? { ...service, isActive: false, updatedAt: new Date().toISOString() } : service
    );
}

/* ---------- Categorías: operaciones (mock) ---------- */

let nextCategoryId = 1;

function assertCategoryNameFree(name: string, ignoreId?: string) {
    if (
        categoryStore.some(
            (category) => category.id !== ignoreId && normalizeText(category.name) === normalizeText(name)
        )
    ) {
        throw new ApiError('Category name is already in use', 409);
    }
}

export async function mockListServiceCategories(): Promise<ServiceCategory[]> {
    await wait();
    return [...categoryStore].sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export async function mockCreateServiceCategory(payload: ServiceCategoryPayload): Promise<ServiceCategory> {
    await wait();
    assertCategoryNameFree(payload.name);

    const now = new Date().toISOString();
    const category: ServiceCategory = {
        id: `svc-cat-new-${nextCategoryId++}`,
        ...payload,
        createdAt: now,
        updatedAt: now
    };
    categoryStore = [category, ...categoryStore];
    return category;
}

/* Si la categoría pasa a inactiva, sus servicios se desactivan en la misma operación (igual que el backend). */
export async function mockUpdateServiceCategory(id: string, payload: ServiceCategoryPayload): Promise<ServiceCategory> {
    await wait();

    const current = categoryStore.find((category) => category.id === id);
    if (!current) throw new ApiError('Category not found', 404);
    assertCategoryNameFree(payload.name, id);

    const updated: ServiceCategory = { ...current, ...payload, updatedAt: new Date().toISOString() };
    categoryStore = categoryStore.map((category) => (category.id === id ? updated : category));
    if (current.isActive && !payload.isActive) deactivateServicesOf(id);
    return updated;
}

/* DELETE /servicesCategories/:id: borrado lógico de la categoría y de todos sus servicios. Es idempotente. */
export async function mockDeleteServiceCategory(id: string): Promise<void> {
    await wait();

    const current = categoryStore.find((category) => category.id === id);
    if (!current) throw new ApiError('Category not found', 404);

    categoryStore = categoryStore.map((category) =>
        category.id === id ? { ...category, isActive: false, updatedAt: new Date().toISOString() } : category
    );
    deactivateServicesOf(id);
}
