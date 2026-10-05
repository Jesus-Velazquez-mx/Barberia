/* Forma esperada del payload de disponibilidad.
   Se reconcilia con el DTO real del backend en la tarea "Integrar frontend con backend". */

export interface AvailableSlot {
  barberId: string;
  barberName: string;
  /** Fecha y hora de inicio en ISO 8601, p. ej. "2026-10-12T10:00:00" */
  startTime: string;
}

export type AvailabilityLevel = 'high' | 'medium' | 'low' | 'none';

/* Resumen por día para colorear el calendario */
export interface DayAvailability {
  level: AvailabilityLevel;
  slotsCount: number;
}
