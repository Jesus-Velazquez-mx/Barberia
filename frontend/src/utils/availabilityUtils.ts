/* Zona horaria del negocio: los horarios de las citas siempre se muestran en la hora local
   de la sucursal, sin importar la del dispositivo. Debe coincidir con BUSINESS_TIMEZONE (o su
   valor por defecto) en el backend; ver backend/src/utils/businessTime.ts. */
const BUSINESS_TIMEZONE = 'America/Mazatlan';

/* "2026-10-23T17:15:00.000Z" (instante UTC real) -> "10:15" en hora de la sucursal */
export const formatSlotTime = (startTime: string): string =>
    new Date(startTime).toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: BUSINESS_TIMEZONE
    });
