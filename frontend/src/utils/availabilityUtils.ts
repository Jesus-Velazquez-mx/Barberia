/* "2026-10-12T10:00:00" -> "10:00" */
export const formatSlotTime = (startTime: string): string =>
    new Date(startTime).toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
