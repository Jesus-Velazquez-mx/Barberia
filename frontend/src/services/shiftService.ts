import { apiClient } from './apiClient';
import { normalizeTime } from '../utils/shiftUtils';
import type { Shift, ShiftPayload } from '../types/shiftType';

/* ---------- Tipos de la API ---------- */

/* Coincide con la respuesta del backend (GET/POST/PUT /shifts). */
interface ShiftApi {
    id: string;
    name: string;
    start_time: string; // "08:00:00"
    end_time: string;
    created_at?: string;
    updated_at?: string;
}

/* ---------- Utilidades ---------- */

const authHeaders = (token: string): RequestInit => ({ headers: { Authorization: `Bearer ${token}` } });

const toShift = (a: ShiftApi): Shift => ({
    id: a.id,
    name: a.name,
    startTime: normalizeTime(a.start_time), // "08:00:00" -> "08:00"
    endTime: normalizeTime(a.end_time)
});

const toBody = (payload: ShiftPayload) => ({
    name: payload.name.trim(),
    start_time: payload.startTime, // "HH:MM"
    end_time: payload.endTime
});

/* ---------- Consultas ---------- */

export async function getShifts(token: string): Promise<Shift[]> {
    const { data } = await apiClient.get<ShiftApi[]>('/shifts', authHeaders(token));
    return data.map(toShift);
}

/* ---------- Escritura ---------- */

/* El backend responde 409 si el nombre o el horario exacto ya existen, y 422 si la duración no es de 4, 6 u 8 horas. */
export async function createShift(payload: ShiftPayload, token: string): Promise<Shift> {
    const { data } = await apiClient.post<ShiftApi>('/shifts', toBody(payload), authHeaders(token));
    return toShift(data);
}

export async function updateShift(id: string, payload: ShiftPayload, token: string): Promise<Shift> {
    const { data } = await apiClient.put<ShiftApi>(`/shifts/${id}`, toBody(payload), authHeaders(token));
    return toShift(data);
}

/* El backend responde 409 si es el único turno o tiene personal asignado. */
export async function deleteShift(shift: Shift, token: string): Promise<void> {
    await apiClient.delete(`/shifts/${shift.id}`, authHeaders(token));
}