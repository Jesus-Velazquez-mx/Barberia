export interface NameParts {
    firstName: string;
    lastName: string;
}

export const joinFullName = ({ firstName, lastName }: NameParts): string => `${firstName} ${lastName}`.trim();

/*
 * El formulario usa un solo campo "Nombre Completo"; el backend pide nombre y apellido por separado.
 * Regla: con 2 palabras, 1 nombre y 1 apellido; con 3 o más, los dos últimos son apellidos
 * ("Juan Carlos Pérez López" => nombre "Juan Carlos", apellidos "Pérez López").
 * Regresa null si no hay al menos 2 palabras o alguna parte tiene menos de 2 caracteres.
 */
export function splitFullName(fullName: string): NameParts | null {
    const words = fullName.trim().split(/\s+/).filter(Boolean);
    if (words.length < 2) return null;

    const lastNameWordCount = words.length === 2 ? 1 : 2;
    const firstName = words.slice(0, words.length - lastNameWordCount).join(' ');
    const lastName = words.slice(words.length - lastNameWordCount).join(' ');

    if (firstName.length < 2 || lastName.length < 2) return null;

    return { firstName, lastName };
}

/*
 * Si el usuario no cambió el nombre al editar, se conservan las partes originales:
 * volver a separar el texto podría mover una palabra de nombre a apellido.
 */
export function resolveNameParts(fullName: string, original?: NameParts): NameParts | null {
    const normalized = fullName.trim().replace(/\s+/g, ' ');

    if (original && joinFullName(original) === normalized) return original;

    return splitFullName(normalized);
}

/* Deja solo los dígitos: "667 123-4567" => "6671234567". */
export const normalizePhone = (value: string): string => value.replace(/\D/g, '');

/* "6671234567" => "667 123 4567". Si no tiene 10 dígitos se muestra tal cual. */
export function formatPhone(phone: string | null): string {
    if (!phone) return '—';

    const digits = normalizePhone(phone);
    if (digits.length !== 10) return phone;

    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}
