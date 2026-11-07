// Datos mock SOLO para el dashboard del manager (clientes y suministros pendientes de integrar).
import type { SelectOption } from '../components/common/SelectFieldComponent';
import type { ClientPayload, ClientRecord } from '../types/clientType';
import { ApiError } from '../types/api';
import { normalizeText } from '../utils/listUtils';

/* ---------- Catálogos (mock) ---------- */

export const MOCK_SHOP_OPTIONS: SelectOption[] = [
    { value: 'shop-1', label: 'Mr. Barber Sendero' },
    { value: 'shop-2', label: 'Mr. Barber Explanada' }
];

/* ---------- Datos iniciales ---------- */

type ClientSeed = [firstName: string, lastName: string, completedServicesCount: number];

const CLIENT_SEED: ClientSeed[] = [
    ['Carlos', 'Mendoza Lara', 12],
    ['José', 'Hernández Gil', 3],
    ['Alejandro', 'Cárdenas Ortiz', 0],
    ['Roberto', 'Salazar Nava', 7],
    ['Diego', 'Padilla Ramos', 1],
    ['Héctor', 'Navarro Cruz', 15],
    ['Sergio', 'Ibarra Mejía', 4],
    ['Pablo', 'Ontiveros Díaz', 9],
    ['Manuel', 'Gastélum Rivas', 2],
    ['Raúl', 'Castañeda Peña', 6],
    ['Óscar', 'Barraza Medina', 0],
    ['Javier', 'Zamora Ochoa', 11],
    ['Emilio', 'Aguilar Lizárraga', 5],
    ['Adrián', 'Molina Esquer', 8],
    ['Gustavo', 'Robles Cuen', 1],
    ['Francisco', 'Urías Montoya', 13],
    ['Rodrigo', 'Meza Zepeda', 2],
    ['Alberto', 'Bojórquez Sáinz', 10],
    ['Víctor', 'Echeverría Soto', 0],
    ['Enrique', 'Tapia Millán', 4],
    ['Ángel', 'Lizárraga Cebreros', 6],
    ['Mauricio', 'Cervantes Frías', 3],
    ['Julio', 'Montes Delgado', 14]
];

/* Teléfono sintético de 10 dígitos (lada 667) y único por posición. */
const buildPhone = (index: number): string => `667${String(1230000 + index * 4567).padStart(7, '0')}`;

const buildEmail = (firstName: string, lastName: string): string => {
    const first = normalizeText(firstName.split(' ')[0]);
    const last = normalizeText(lastName.split(' ')[0]);
    return `${first}.${last}@email.com`;
};

const buildInitialClients = (): ClientRecord[] =>
    CLIENT_SEED.map(([firstName, lastName, completedServicesCount], index) => ({
        id: `client-${index + 1}`,
        firstName,
        lastName,
        email: buildEmail(firstName, lastName),
        phone: buildPhone(index + 40),
        completedServicesCount
    }));

/* ---------- "Base de datos" en memoria ---------- */

let clientStore: ClientRecord[] = buildInitialClients();
let nextId = 1;

const wait = (ms = 350) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/* El correo y el teléfono son únicos entre todos los usuarios, igual que en la BD real. */
function assertUnique(email: string | null, phone: string, ignoreId?: string) {
    const emailKey = email ? email.toLowerCase() : null;
    const others = clientStore.filter((person) => person.id !== ignoreId);

    if (emailKey && others.some((person) => person.email?.toLowerCase() === emailKey)) {
        throw new ApiError('Este correo ya está registrado.', 409);
    }
    if (others.some((person) => person.phone === phone)) {
        throw new ApiError('Este teléfono ya está registrado.', 409);
    }
}

/* Clientes */

export async function mockListClients(): Promise<ClientRecord[]> {
    await wait();
    return [...clientStore];
}

export async function mockCreateClient(payload: ClientPayload): Promise<ClientRecord> {
    await wait();
    assertUnique(payload.email, payload.phone);

    const created: ClientRecord = { id: `client-new-${nextId++}`, ...payload, completedServicesCount: 0 };
    clientStore = [created, ...clientStore];
    return created;
}

export async function mockUpdateClient(id: string, payload: ClientPayload): Promise<ClientRecord> {
    await wait();
    assertUnique(payload.email, payload.phone, id);

    const current = clientStore.find((client) => client.id === id);
    if (!current) throw new ApiError('Cliente no encontrado.', 404);

    const updated: ClientRecord = { ...current, ...payload };
    clientStore = clientStore.map((client) => (client.id === id ? updated : client));
    return updated;
}

export async function mockDeleteClient(id: string): Promise<void> {
    await wait();
    if (!clientStore.some((client) => client.id === id)) throw new ApiError('Cliente no encontrado.', 404);
    clientStore = clientStore.filter((client) => client.id !== id);
}
