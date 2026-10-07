/* El <input type="date"> nativo muestra la fecha según el idioma del navegador/SO y no se puede
   forzar. Por eso los campos de fecha son texto con formato dd/mm/aaaa y la API sigue usando
   YYYY-MM-DD; estas utilidades convierten entre ambos. */

const DISPLAY_DATE_REGEX = /^(\d{2})\/(\d{2})\/(\d{4})$/;

/* Fecha local de hoy en YYYY-MM-DD. No usar toISOString() directo: devuelve la
   fecha UTC y por la noche (hora de México) ya marcaría "mañana". */
export const getTodayIso = (): string => {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().split('T')[0];
};

/* YYYY-MM-DD (o ISO completo) -> dd/mm/aaaa. Regresa '' si no hay fecha. */
export const isoToDisplayDate = (isoDate: string | null | undefined): string => {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
};

/* Verdadero solo si el texto es dd/mm/aaaa y corresponde a un día real (rechaza 31/02/2000). */
export const isValidDisplayDate = (value: string): boolean => {
  const match = DISPLAY_DATE_REGEX.exec(value);
  if (!match) return false;

  const [, day, month, year] = match.map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};

/* dd/mm/aaaa -> YYYY-MM-DD. Regresa '' si el texto no es una fecha válida. */
export const displayToIsoDate = (value: string): string => {
  if (!isValidDisplayDate(value)) return '';
  const [day, month, year] = value.split('/');
  return `${year}-${month}-${day}`;
};

/* Aplica la máscara mientras se teclea: solo dígitos, con "/" automáticas. */
export const maskDisplayDate = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};
