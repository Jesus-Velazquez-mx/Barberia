import type { AppointmentStatus } from "../types/appointmentType";

/** Etiqueta que ve el cliente para cada estado de la tabla. */
export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  scheduled: 'Agendada',
  rescheduled: 'Reagendada',
  checkedIn: 'Ya llegaste',
  completed: 'Completada',
  cancelled: 'Cancelada',
  noShow: 'No se presentó',
};

/** Solo una cita agendada (aún sin check-in) se puede cancelar. */
export function canCancel(status: AppointmentStatus): boolean {
  return status === 'scheduled';
}
