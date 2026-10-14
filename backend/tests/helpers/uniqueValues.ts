import { randomUUID } from 'node:crypto';

/**
 * Generadores de valores únicos para fixtures de prueba.
 *
 * Los valores basados en Date.now() colisionaban cuando dos archivos de prueba
 * (workers de Jest en paralelo) generaban un valor en el mismo milisegundo, lo
 * que violaba las restricciones UNIQUE de users/barbers/shops. randomUUID no
 * depende del reloj ni de contadores por proceso.
 */

export const generateUniqueEmail = (prefix = 'test') => `${prefix}_${randomUUID()}@mrbarber.com`;

/**
 * La columna phone es varchar(10) UNIQUE, así que un UUID completo no cabe:
 * se derivan 10 dígitos a partir de 48 bits de un UUID aleatorio.
 */
export const generateUniquePhone = () => {
    const bits = parseInt(randomUUID().replace(/-/g, '').slice(0, 12), 16);
    return String(bits % 10 ** 10).padStart(10, '0');
};

/** El UUID completo (36 chars) cabe en shops.name varchar(50) con prefijos de hasta 13 chars. */
export const generateUniqueName = (prefix = 'Test') => `${prefix} ${randomUUID()}`;
