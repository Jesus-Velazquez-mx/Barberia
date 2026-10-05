import type { AvailabilityLevel } from '../types/availabilityType';

/* Umbrales temporales (mock): se ajustan cuando se conozca el criterio real. */
export const getAvailabilityLevel = (slotsCount: number): AvailabilityLevel => {
  if (slotsCount <= 0) return 'none';
  if (slotsCount <= 5) return 'low';
  if (slotsCount <= 12) return 'medium';
  return 'high';
};

/* "2026-10-12T10:00:00" -> "10:00" */
export const formatSlotTime = (startTime: string): string =>
  new Date(startTime).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
