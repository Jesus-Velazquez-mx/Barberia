/**
 * Contexto que recibe cada job en una corrida. `now` es el reloj inyectable: los jobs deben usarlo
 * (p. ej. como parámetro `$1` en SQL) en lugar de `now()`/`Date.now()`, para poder probarlos de forma
 * determinística. Todos los jobs de un mismo grupo reciben el mismo `now` dentro de una corrida.
 */
export interface JobContext {
    now: Date;
}

/** Resultado opcional de un job, usado para el log por corrida. */
export interface JobResult {
    /** Cantidad de filas/elementos procesados (p. ej. citas actualizadas o recordatorios enviados). */
    affected?: number;
}

/**
 * Unidad de trabajo periódica. Debe ser idempotente: re-ejecutarla (o ejecutarla en varias instancias)
 * no debe producir efectos adicionales.
 */
export interface Job {
    name: string;
    run(ctx: JobContext): Promise<JobResult | void>;
}

/**
 * Conjunto ordenado de jobs que comparten intervalo y candado. Los jobs se ejecutan secuencialmente,
 * en el orden del arreglo; un error en uno se registra y no impide que corran los siguientes.
 */
export interface JobGroup {
    name: string;
    /** Retraso entre el fin de una corrida y el inicio de la siguiente (fixed delay). */
    intervalMs: number;
    /** Clave de `pg_try_advisory_lock`; debe ser única por grupo. */
    lockKey: number;
    jobs: Job[];
}
