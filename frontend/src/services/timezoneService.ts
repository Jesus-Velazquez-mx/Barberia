import { apiClient } from "./apiClient"

const DEFAULT_BUSINESS_TIMEZONE = 'America/Mazatlan';

const INIT_TIMEOUT_MS = 3000;

let businessTimezone = DEFAULT_BUSINESS_TIMEZONE;

export const getBusinessTimezone = (): string => businessTimezone;

export const initBusinessTimezone = async (): Promise<void> => {
    try {
        const response = await apiClient.get<string>('/business-timezone', {
            signal: AbortSignal.timeout(INIT_TIMEOUT_MS)
        });

        /* Se valida que sea una zona IANA reconocida antes de adoptarla (Intl lanza RangeError si no). */
        new Intl.DateTimeFormat('en-US', { timeZone: response.data });
        businessTimezone = response.data;
    } catch {
        /* Se queda con el valor por defecto. */
    }
}
