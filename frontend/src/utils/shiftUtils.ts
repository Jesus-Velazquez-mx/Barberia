/* Duraciones permitidas por el backend, en horas. */
export const ALLOWED_SHIFT_HOURS = [4, 6, 8];

/* Nombres de la BD que tienen etiqueta en español; cualquier otro se muestra tal cual. */
const SHIFT_NAME_LABELS: Record<string, string> = {
  morning: 'Matutino',
  afternoon: 'Vespertino'
};

export const getShiftLabel = (name: string): string => SHIFT_NAME_LABELS[name.trim().toLowerCase()] ?? name;

/* Inverso de getShiftLabel: 'Matutino' -> 'morning'. Cualquier otro nombre se envía tal cual. */
export const toShiftName = (label: string): string => {
  const clean = label.trim();
  const match = Object.entries(SHIFT_NAME_LABELS).find(
    ([, value]) => value.toLowerCase() === clean.toLowerCase()
  );
  return match ? match[0] : clean;
};

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

/* true si es válido; si no, el mensaje de error. Misma regla que el backend. */
export const validateShiftTimes = (startTime: string, endTime: string): string | true => {
  if (!startTime || !endTime) return true;

  const minutes = getShiftDurationMinutes(startTime, endTime);
  if (minutes <= 0) return 'La hora de fin debe ser posterior a la de inicio.';
  if (!ALLOWED_SHIFT_HOURS.some((hours) => hours * 60 === minutes)) {
    return `El turno debe durar ${ALLOWED_SHIFT_HOURS.join(', ')} horas.`;
  }
  return true;
};