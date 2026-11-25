import db from '../connection/connection.js';
import type { BarberPerformance } from '../types/entities/barberPerformance.interface.js';

export interface BarberPerformanceFilters {
    // Sucursal donde se agendaron las citas que se evalúan.
    shopId: string;
    // Sucursales del gerente: solo se devuelven barberos asignados a alguna de ellas.
    managedShopIds: string[];
    // Fechas de calendario 'YYYY-MM-DD', ambas inclusivas, interpretadas en timeZone.
    startDate: string;
    endDate: string;
    timeZone: string;
}

/**
 * Conteos de citas y servicios por barbero en una sucursal y un rango de fechas.
 *
 * - Cada cita cuenta en el día de su inicio programado (scheduled_start), igual para agendadas y finalizadas,
 *   de modo que ambos conteos salgan de las mismas citas.
 * - "Agendado" es toda cita registrada en el rango, sin importar su estado; "finalizado" es status = 'completed'.
 * - Devuelve a los barberos asignados a la sucursal (incluidos los dados de baja) y a los que tienen citas en
 *   ella dentro del rango aunque después se les haya reasignado a otra sucursal del mismo gerente.
 */
export const getBarberPerformance = async (filters: BarberPerformanceFilters): Promise<BarberPerformance[]> => {
    const result = await db.getPool().query<BarberPerformance>(
        `WITH metrics AS (
             SELECT a.barber_id,
                    COUNT(DISTINCT a.id)::int                                         AS scheduled_appointments,
                    (COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed'))::int AS completed_appointments,
                    COUNT(aps.id)::int                                                AS scheduled_services,
                    (COUNT(aps.id) FILTER (WHERE a.status = 'completed'))::int        AS completed_services,
                    (COUNT(aps.id) FILTER (WHERE a.status = 'cancelled'))::int        AS cancelled_services,
                    (COUNT(aps.id) FILTER (WHERE a.status = 'no_show'))::int          AS no_show_services
             FROM appointments a
             LEFT JOIN appointment_services aps ON aps.appointment_id = a.id
             WHERE a.shop_id = $1
               AND a.scheduled_start >= ($3::date)::timestamp AT TIME ZONE $5
               AND a.scheduled_start < ($4::date + 1)::timestamp AT TIME ZONE $5
             GROUP BY a.barber_id
         )
         SELECT b.id AS barber_id, b.first_name, b.last_name, b.email, b.deleted_at,
                s.id AS assigned_shop_id, s.name AS assigned_shop_name,
                COALESCE(m.scheduled_appointments, 0) AS scheduled_appointments,
                COALESCE(m.completed_appointments, 0) AS completed_appointments,
                COALESCE(m.scheduled_services, 0)     AS scheduled_services,
                COALESCE(m.completed_services, 0)     AS completed_services,
                COALESCE(m.cancelled_services, 0)     AS cancelled_services,
                COALESCE(m.no_show_services, 0)       AS no_show_services
         FROM barbers b
         JOIN shops s ON s.id = b.shop_id
         LEFT JOIN metrics m ON m.barber_id = b.id
         WHERE b.shop_id = ANY($2::uuid[])
           AND (b.shop_id = $1 OR m.barber_id IS NOT NULL)
         ORDER BY b.first_name ASC, b.last_name ASC, b.id ASC`,
        [filters.shopId, filters.managedShopIds, filters.startDate, filters.endDate, filters.timeZone]
    );
    return result.rows;
};
