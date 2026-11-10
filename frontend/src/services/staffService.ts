import { apiClient } from './apiClient';
import type { Shop } from '../types/shop';
import type { StaffMember, StaffPayload } from '../types/staffType';

/* ---------- Tipos de la API ---------- */

interface BarberApi {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    birthDate: string;
    gender: string;
    shopId: string;
    shiftId: string;
    bio: string | null;
    isAcceptingBookings: boolean;
    deletedAt: string | null;
}

interface ReceptionistApi {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    birthDate: string;
    gender: string;
    shopId: string;
    shiftId: string;
    deletedAt: string | null;
}

/* ---------- Utilidades ---------- */

const authHeaders = (token: string): RequestInit => ({ headers: { Authorization: `Bearer ${token}` } });

const toBarberMember = (barber: BarberApi): StaffMember => ({
    id: barber.id,
    firstName: barber.firstName,
    lastName: barber.lastName,
    email: barber.email,
    phone: barber.phone,
    birthDate: barber.birthDate ? barber.birthDate.slice(0, 10) : '',
    gender: barber.gender,
    role: 'barber',
    shopId: barber.shopId,
    shiftId: barber.shiftId,
    isActive: barber.deletedAt === null
});

const toReceptionistMember = (receptionist: ReceptionistApi): StaffMember => ({
    id: receptionist.userId,
    firstName: receptionist.firstName,
    lastName: receptionist.lastName,
    email: receptionist.email,
    phone: receptionist.phone,
    birthDate: receptionist.birthDate ? receptionist.birthDate.slice(0, 10) : '',
    gender: receptionist.gender,
    role: 'receptionist',
    shopId: receptionist.shopId,
    shiftId: receptionist.shiftId,
    isActive: receptionist.deletedAt === null
});

/* Campos comunes que se envían al backend al crear o actualizar (sin rol ni contraseña). */
const toStaffBody = ({ firstName, lastName, email, phone, birthDate, gender, shopId, shiftId }: StaffPayload) => ({
    firstName,
    lastName,
    email,
    phone,
    birthDate,
    gender,
    shopId,
    shiftId
});

/* ---------- Consultas ---------- */

/* Barberos y recepcionistas de una sucursal, incluidos los dados de baja. */
const getStaffByShop = async (shopId: string, token: string): Promise<StaffMember[]> => {
    const [barbersRes, receptionistsRes] = await Promise.all([
        apiClient.get<BarberApi[]>(`/shops/${shopId}/barbers?includeInactive=true`, authHeaders(token)),
        apiClient.get<ReceptionistApi[]>(`/shops/${shopId}/receptionists?includeInactive=true`, authHeaders(token))
    ]);

    return [
        ...barbersRes.data.map(toBarberMember),
        ...receptionistsRes.data.map(toReceptionistMember)
    ];
};

/* Personal de las sucursales indicadas. Si una sucursal falla se omite; solo falla si fallan todas. */
export const getStaff = async (token: string, shops: Shop[]): Promise<StaffMember[]> => {
    if (shops.length === 0) return [];

    const results = await Promise.allSettled(shops.map((shop) => getStaffByShop(shop.id, token)));
    const loaded = results.filter((result) => result.status === 'fulfilled');
    if (loaded.length === 0) throw (results[0] as PromiseRejectedResult).reason;

    return loaded.flatMap((result) => result.value);
};

/* ---------- Escritura ---------- */

export const createStaff = async (payload: StaffPayload, token: string): Promise<StaffMember> => {
    if (payload.role === 'barber') {
        const { data } = await apiClient.post<BarberApi>('/barbers', toStaffBody(payload), authHeaders(token));
        return toBarberMember(data);
    }

    const { data } = await apiClient.post<ReceptionistApi>(
        '/receptionists',
        { ...toStaffBody(payload), ...(payload.password && { password: payload.password }) },
        authHeaders(token)
    );
    return toReceptionistMember(data);
};

/* Reactiva un barbero o recepcionista dado de baja conservando sus datos actuales (y nueva contraseña para recepcionista). */
export const reactivateStaff = async (
    member: StaffMember,
    token: string,
    password?: string
): Promise<StaffMember> =>
    createStaff(
        {
            firstName: member.firstName,
            lastName: member.lastName,
            email: member.email ?? '',
            phone: member.phone ?? '',
            birthDate: member.birthDate,
            gender: member.gender,
            role: member.role,
            shopId: member.shopId,
            shiftId: member.shiftId,
            ...(password && { password })
        },
        token
    );

export const updateStaff = async (id: string, payload: StaffPayload, token: string): Promise<StaffMember> => {
    const body = toStaffBody(payload);

    if (payload.role === 'barber') {
        const { data } = await apiClient.put<BarberApi>(`/barbers/${id}`, body, authHeaders(token));
        return toBarberMember(data);
    }

    const { data } = await apiClient.put<ReceptionistApi>(`/receptionists/${id}`, body, authHeaders(token));
    return toReceptionistMember(data);
};

/* Recibe el miembro completo porque el endpoint depende de su rol. */
export const deleteStaff = async (member: StaffMember, token: string): Promise<void> => {
    const path = member.role === 'barber' ? `/barbers/${member.id}` : `/receptionists/${member.id}`;
    await apiClient.delete(path, authHeaders(token));
};
