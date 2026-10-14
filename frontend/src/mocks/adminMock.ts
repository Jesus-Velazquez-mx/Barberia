// Datos mock SOLO para el dashboard del manager (sin backend).
// Se elimina cuando existan los endpoints de personal y clientes ("Integrar frontend con backend").
import type { SelectOption } from '../components/SelectFieldComponent';
import type { ClientPayload, ClientRecord } from '../types/clientType';
import type { StaffMember, StaffPayload, StaffRole } from '../types/staffType';
import { ApiError } from '../types/api';
import { normalizeText } from '../utils/listUtils';

/* ---------- Catálogos (mock) ---------- */

export const MOCK_SHOP_OPTIONS: SelectOption[] = [
    { value: 'shop-1', label: 'Mr. Barber Sendero' },
    { value: 'shop-2', label: 'Mr. Barber Explanada' }
];

/* Horarios de los turnos reales de la BD: matutino 08:00-16:00 y vespertino 12:00-20:00. */
export const MOCK_SHIFT_OPTIONS: SelectOption[] = [
    { value: 'shift-morning', label: 'Matutino (08:00 - 16:00)' },
    { value: 'shift-afternoon', label: 'Vespertino (12:00 - 20:00)' }
];

/* ---------- Datos iniciales ---------- */

type StaffSeed = [firstName: string, lastName: string, role: StaffRole, shopIndex: number, shiftIndex: number];

const STAFF_SEED: StaffSeed[] = [
    ['Carlos', 'Ramírez Soto', 'barber', 0, 0],
    ['Miguel', 'Torres Vega', 'barber', 0, 1],
    ['Luis', 'Herrera Ibarra', 'barber', 0, 0],
    ['Andrés', 'Beltrán Cota', 'barber', 0, 1],
    ['Jorge', 'Félix Armenta', 'barber', 1, 0],
    ['Ricardo', 'Valdez Rocha', 'barber', 1, 1],
    ['Eduardo', 'Lugo Pérez', 'barber', 1, 0],
    ['Iván', 'Camacho Ruiz', 'barber', 1, 1],
    ['Daniel', 'Osuna Reyes', 'barber', 0, 0],
    ['Fernando', 'Quintero Leal', 'barber', 1, 1],
    ['Mariana', 'López Zazueta', 'receptionist', 0, 0],
    ['Paola', 'Verdugo Acosta', 'receptionist', 0, 1],
    ['Daniela', 'Mendívil Soto', 'receptionist', 1, 0],
    ['Karla', 'Rubio Tirado', 'receptionist', 1, 1]
];

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

const buildInitialStaff = (): StaffMember[] =>
    STAFF_SEED.map(([firstName, lastName, role, shopIndex, shiftIndex], index) => ({
        id: `staff-${index + 1}`,
        firstName,
        lastName,
        // Los barberos no tienen cuenta: algunos no tienen correo
        email: role === 'barber' && index % 4 === 3 ? null : buildEmail(firstName, lastName),
        phone: buildPhone(index),
        role,
        shopId: MOCK_SHOP_OPTIONS[shopIndex].value,
        shiftId: MOCK_SHIFT_OPTIONS[shiftIndex].value
    }));

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

let staffStore: StaffMember[] = buildInitialStaff();
let clientStore: ClientRecord[] = buildInitialClients();
let nextId = 1;

const wait = (ms = 350) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/* El correo y el teléfono son únicos entre todos los usuarios, igual que en la BD real. */
function assertUnique(email: string | null, phone: string, ignoreId?: string) {
    const emailKey = email ? email.toLowerCase() : null;
    const others = [...staffStore, ...clientStore].filter((person) => person.id !== ignoreId);

    if (emailKey && others.some((person) => person.email?.toLowerCase() === emailKey)) {
        throw new ApiError('Este correo ya está registrado.', 409);
    }
    if (others.some((person) => person.phone === phone)) {
        throw new ApiError('Este teléfono ya está registrado.', 409);
    }
}

/* Personal */

export async function mockListStaff(): Promise<StaffMember[]> {
    await wait();
    return [...staffStore];
}

export async function mockCreateStaff(payload: StaffPayload): Promise<StaffMember> {
    await wait();
    assertUnique(payload.email, payload.phone);

    // La contraseña solo viaja al backend real; el mock no la guarda.
    const { password: _password, ...data } = payload;
    const created: StaffMember = { id: `staff-new-${nextId++}`, ...data };
    staffStore = [created, ...staffStore];
    return created;
}

export async function mockUpdateStaff(id: string, payload: StaffPayload): Promise<StaffMember> {
    await wait();
    assertUnique(payload.email, payload.phone, id);

    const current = staffStore.find((member) => member.id === id);
    if (!current) throw new ApiError('Personal no encontrado.', 404);

    const { password: _password, ...data } = payload;
    const updated: StaffMember = { ...current, ...data };
    staffStore = staffStore.map((member) => (member.id === id ? updated : member));
    return updated;
}

export async function mockDeleteStaff(id: string): Promise<void> {
    await wait();
    if (!staffStore.some((member) => member.id === id)) throw new ApiError('Personal no encontrado.', 404);
    staffStore = staffStore.filter((member) => member.id !== id);
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
