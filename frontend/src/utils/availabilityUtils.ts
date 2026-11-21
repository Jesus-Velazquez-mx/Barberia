import { getBusinessTimezone } from '../services/timezoneService';

/* Los horarios de las citas siempre se muestran en la hora local de la sucursal (zona horaria
   del negocio que entrega el backend), sin importar la del dispositivo. */

/* "2026-10-23T17:15:00.000Z" (instante UTC real) -> "10:15" en hora de la sucursal */
export const formatSlotTime = (startTime: string): string =>
    new Date(startTime).toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: getBusinessTimezone()
    });
