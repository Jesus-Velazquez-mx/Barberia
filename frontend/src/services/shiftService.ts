import { MOCK_SHIFTS } from '../mocks/shiftMocks';
import { normalizeTime } from '../utils/shiftUtils';
import type { Shift, ShiftPayload } from '../types/shiftType';

/* Servicio con mock data. Cuando exista la API, reemplaza el cuerpo de cada función por su fetch
   (GET/POST/PUT/DELETE /api/shifts) y recibe el token como en staffService; la firma ya devuelve
   lo mismo y las reglas de abajo (409) son las que responde el backend. */

let shifts: Shift[] = MOCK_SHIFTS.map((shift) => ({ ...shift }));

const delay = (ms = 350) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

const findConflict = (payload: ShiftPayload, ignoreId?: string): string | null => {
  const others = shifts.filter((shift) => shift.id !== ignoreId);

  if (others.some((shift) => sameName(shift.name, payload.name))) {
    return 'Ya existe un turno con ese nombre.';
  }
  if (
    others.some(
      (shift) =>
        normalizeTime(shift.startTime) === payload.startTime && normalizeTime(shift.endTime) === payload.endTime
    )
  ) {
    return 'Ya existe un turno con ese horario.';
  }
  return null;
};

export async function getShifts(): Promise<Shift[]> {
  await delay();
  return shifts.map((shift) => ({ ...shift }));
}

export async function createShift(payload: ShiftPayload): Promise<Shift> {
  await delay();

  const conflict = findConflict(payload);
  if (conflict) throw new Error(conflict);

  const created: Shift = { id: crypto.randomUUID(), ...payload};
  shifts = [created, ...shifts];
  return { ...created };
}

export async function updateShift(id: string, payload: ShiftPayload): Promise<Shift> {
  await delay();

  const current = shifts.find((shift) => shift.id === id);
  if (!current) throw new Error('No encontramos el turno.');

  const conflict = findConflict(payload, id);
  if (conflict) throw new Error(conflict);

  const updated: Shift = { ...current, ...payload };
  shifts = shifts.map((shift) => (shift.id === id ? updated : shift));
  return { ...updated };
}

export async function deleteShift(shift: Shift): Promise<void> {
  await delay();

  const current = shifts.find((item) => item.id === shift.id);
  if (!current) throw new Error('No encontramos el turno.');
  


  shifts = shifts.filter((item) => item.id !== shift.id);
}
