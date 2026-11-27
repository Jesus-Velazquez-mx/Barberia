import { ApiError } from '../types/api';

/* Mensaje para cuando la petición ni siquiera llegó al servidor (ApiError con status 0). */
export const NETWORK_ERROR_MESSAGE = 'No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.';

/* Traducciones de los mensajes que devuelve el backend (en inglés) a mensajes para el usuario. */
const SERVER_MESSAGE_TRANSLATIONS: Record<string, string> = {
    // Horarios y disponibilidad
    'Selected time slot is no longer available': 'El horario seleccionado ya no está disponible. Elige otro.',
    'Selected time slot is not available': 'El horario seleccionado no está disponible. Elige otro.',
    'Selected services do not fit in the barber shift': 'Los servicios seleccionados no caben en el turno del barbero.',
    'Barber is busy during the previous slot': 'El barbero está ocupado en el horario anterior.',
    'to must not be before from': 'La fecha final no puede ser anterior a la inicial.',
    // Estado de la cita
    'Only future appointments can be edited': 'Solo se pueden editar citas futuras.',
    'Only future appointments can be cancelled': 'Solo se pueden cancelar citas futuras.',
    'Only scheduled or rescheduled appointments can be edited':
        'Solo se pueden editar citas agendadas o reprogramadas.',
    'Only scheduled or rescheduled appointments can be cancelled':
        'Solo se pueden cancelar citas agendadas o reprogramadas.',
    'Only scheduled or rescheduled appointments can be checked in':
        'Solo se puede registrar la llegada de citas agendadas o reprogramadas.',
    'Only scheduled or rescheduled appointments can be marked as no-show':
        'Solo se pueden marcar como inasistencia las citas agendadas o reprogramadas.',
    'Appointment can no longer be marked as no-show': 'La cita ya no se puede marcar como inasistencia.',
    'Appointment cannot be marked as no-show before its scheduled start':
        'La cita no se puede marcar como inasistencia antes de su hora de inicio.',
    'Walk-in appointments cannot be marked as no-show': 'Los servicios sin cita no se pueden marcar como inasistencia.',
    'Check-in window has expired (10 minutes after scheduled start)':
        'El tiempo para registrar la llegada expiró (10 minutos después de la hora de inicio).',
    // Datos de la cita
    'Either clientId or guestClientName is required': 'Selecciona un cliente o escribe el nombre del cliente invitado.',
    'Client ID is required': 'Selecciona un cliente.',
    'Barber is not accepting bookings': 'El barbero no está aceptando citas.',
    'Barber must belong to the same shop as the appointment': 'El barbero debe pertenecer a la sucursal de la cita.',
    'The appointment does not belong to the requested shop': 'La cita no pertenece a la sucursal indicada.',
    'Clients cannot create walk-in appointments': 'Los clientes no pueden registrar servicios sin cita.',
    // No encontrados
    'Appointment not found': 'La cita no existe.',
    'Barber not found': 'El barbero no existe.',
    'Barber not found or is not accepting bookings': 'El barbero no existe o no está aceptando citas.',
    'Barber not found or is not accepting bookings at this shop':
        'El barbero no existe o no está aceptando citas en esta sucursal.',
    'Client not found': 'El cliente no existe.',
    'Client could not be found': 'El cliente no existe.',
    'Client profile not found': 'El perfil del cliente no existe.',
    'Service not found': 'El servicio no existe.',
    'Service not found or is inactive': 'El servicio no existe o está inactivo.',
    'Shop not found': 'La sucursal no existe.',
    'Shop not found or is inactive': 'La sucursal no existe o está inactiva.',
    // Permisos
    'Not authorized to view this appointment': 'No tienes permiso para ver esta cita.',
    'Not authorized to edit this appointment': 'No tienes permiso para editar esta cita.',
    'Not authorized to cancel this appointment': 'No tienes permiso para cancelar esta cita.',
    'Not authorized to create this appointment': 'No tienes permiso para agendar esta cita.',
    'Not authorized to check in this appointment': 'No tienes permiso para registrar la llegada de esta cita.',
    'Not authorized to mark this appointment as no-show': 'No tienes permiso para marcar esta cita como inasistencia.',
    'Not authorized to view appointments of this shop': 'No tienes permiso para ver las citas de esta sucursal.',
    'Not authorized to manage walk-ins of this shop':
        'No tienes permiso para registrar servicios sin cita en esta sucursal.',
    'Receptionist is not assigned to a shop': 'No tienes una sucursal asignada.',
    'Only staff can search clients': 'Solo el personal puede buscar clientes.',
    'Only staff can list clients': 'Solo el personal puede consultar clientes.'
};

/* Algunos mensajes (backend de reportes, mocks) ya vienen en español: se muestran tal cual. */
const looksSpanish = (message: string): boolean => /[áéíóúñ¿¡]/i.test(message) || /\.\s*$/.test(message);

/* Devuelve el mensaje en español para el usuario, o null si no hay una traducción confiable. */
function toUserMessage(message: string | undefined): string | null {
    const trimmed = message?.trim();
    if (!trimmed) return null;
    return SERVER_MESSAGE_TRANSLATIONS[trimmed] ?? (looksSpanish(trimmed) ? trimmed : null);
}

/* Los errores de validación pueden ser strings u objetos ({ field, detail } de Zod, o { message }). */
function validationEntryText(entry: unknown): string | undefined {
    if (typeof entry === 'string') return entry;
    if (entry && typeof entry === 'object') {
        const { message, detail } = entry as { message?: unknown; detail?: unknown };
        if (typeof message === 'string') return message;
        if (typeof detail === 'string') return detail;
    }
    return undefined;
}

/*
 * Convierte cualquier error en un mensaje legible en español para mostrar al usuario.
 * Los mensajes del servidor se traducen; si no hay traducción se usa `fallback`, nunca el texto en inglés.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
    if (!(error instanceof ApiError)) return fallback;

    if (error.status === 0) return NETWORK_ERROR_MESSAGE;

    const translated = toUserMessage(error.message);
    if (translated) return translated;

    if (error.status === 400 && error.errors.length > 0) {
        const details = error.errors.map((entry) => toUserMessage(validationEntryText(entry)));
        if (details.every((detail): detail is string => detail !== null)) return details.join(' ');
    }

    return fallback;
}
