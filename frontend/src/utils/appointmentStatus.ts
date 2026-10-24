import type { AppointmentStatus } from '../types/appointment.ts';

/** Etiqueta que ve el cliente para cada estado de la tabla. */
export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  scheduled: 'Agendada',
  checked_in: 'Ya llegaste',
  completed: 'Completada',
  cancelled: 'Cancelada',
  no_show: 'No se presentó',
};

/** Solo una cita agendada (aún sin check-in) se puede cancelar. */
export function canCancel(status: AppointmentStatus): boolean {
  return status === 'scheduled';
}
