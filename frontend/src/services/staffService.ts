import { apiClient } from './apiClient';
import { getShops } from './shopService';
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

/* ---------- Consultas ---------- */

/* Obtiene los barberos y recepcionistas de una sucursal (incluyendo dados de baja si includeInactive = true). */
export const getStaffByShop = async (
    shopId: string,
    token: string,
    includeInactive = true
): Promise<StaffMember[]> => {
    const query = includeInactive ? '?includeInactive=true' : '';
    const [barbersRes, receptionistsRes] = await Promise.all([
        apiClient.get<BarberApi[]>(`/shops/${shopId}/barbers${query}`, authHeaders(token)),
        apiClient.get<ReceptionistApi[]>(`/shops/${shopId}/receptionists${query}`, authHeaders(token))
    ]);

    return [
        ...barbersRes.data.map(toBarberMember),
        ...receptionistsRes.data.map(toReceptionistMember)
    ];
};

/* Obtiene todo el personal de las sucursales indicadas (o de todas las que administra el manager si no se pasan). */
export const getStaff = async (
    token: string,
    includeInactive = true,
    shops?: Shop[]
): Promise<StaffMember[]> => {
    const targetShops = shops ?? (await getShops(token, true));
    if (targetShops.length === 0) return [];

    const byShop = await Promise.all(targetShops.map((shop) => getStaffByShop(shop.id, token, includeInactive)));
    return byShop.flat();
};

/* ---------- Escritura ---------- */

export const createStaff = async (payload: StaffPayload, token: string): Promise<StaffMember> => {
    if (payload.role === 'barber') {
        const { data } = await apiClient.post<BarberApi>(
            '/barbers',
            {
                firstName: payload.firstName,
                lastName: payload.lastName,
                email: payload.email,
                phone: payload.phone,
                birthDate: payload.birthDate,
                gender: payload.gender,
                shopId: payload.shopId,
                shiftId: payload.shiftId
            },
            authHeaders(token)
        );
        return toBarberMember(data);
    }

    const { data } = await apiClient.post<ReceptionistApi>(
        '/receptionists',
        {
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: payload.email,
            phone: payload.phone,
            birthDate: payload.birthDate,
            gender: payload.gender,
            ...(payload.password && { password: payload.password }),
            shopId: payload.shopId,
            shiftId: payload.shiftId
        },
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
    const body = {
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phone: payload.phone,
        birthDate: payload.birthDate,
        gender: payload.gender,
        shopId: payload.shopId,
        shiftId: payload.shiftId
    };

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
