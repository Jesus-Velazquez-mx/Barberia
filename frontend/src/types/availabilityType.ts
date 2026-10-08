/* Forma esperada del payload de disponibilidad.
   Se reconcilia con el DTO real del backend en la tarea "Integrar frontend con backend". */

export interface AvailableSlot {
    barberId: string;
    barberName: string;
    /** Fecha y hora de inicio en ISO 8601, p. ej. "2026-10-12T10:00:00" */
    startTime: string;
}

/* Estado de un día en el calendario:
   - available: hay al menos un horario libre
   - full: es día laborable pero ya no quedan horarios (cupo lleno)
   - closed: día inhábil (la sucursal no trabaja) */
export type DayStatus = 'available' | 'full' | 'closed';

/* Resumen por día para pintar el calendario */
export interface DayAvailability {
    status: DayStatus;
    slotsCount: number;
}
