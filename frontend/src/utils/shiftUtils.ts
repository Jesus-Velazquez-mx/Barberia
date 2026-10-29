
export const SHIFT_MIN_HOURS = 1;

/* Nombres de la BD que tienen etiqueta en español; cualquier otro se muestra tal cual. */
const SHIFT_NAME_LABELS: Record<string, string> = {
  morning: 'Matutino',
  afternoon: 'Vespertino'
};

export const getShiftLabel = (name: string): string => SHIFT_NAME_LABELS[name.trim().toLowerCase()] ?? name;

/* Postgres devuelve 'HH:MM:SS'; la interfaz usa 'HH:MM'. */
export const normalizeTime = (time: string): string => time.slice(0, 5);

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = normalizeTime(time).split(':').map(Number);
  return hours * 60 + minutes;
};

export const getShiftDurationMinutes = (startTime: string, endTime: string): number =>
  timeToMinutes(endTime) - timeToMinutes(startTime);

export const formatShiftDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
};

export const formatShiftRange = (startTime: string, endTime: string): string =>
  `${normalizeTime(startTime)} - ${normalizeTime(endTime)}`;


/* true si es válido; si no, el mensaje de error. */
export const validateShiftTimes = (startTime: string, endTime: string): string | true => {
  if (!startTime || !endTime) return true;

  const minutes = getShiftDurationMinutes(startTime, endTime);
  if (minutes <= 0) return 'La hora de fin debe ser posterior a la de inicio.';
  if (minutes < SHIFT_MIN_HOURS * 60) {
    return `El turno debe durar al menos ${SHIFT_MIN_HOURS} hora.`;
  }
  return true;
};
