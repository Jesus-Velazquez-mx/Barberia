import type { BarberPerformance } from '../types/entities/barberPerformance.interface.js';
import type { BarberPerformanceResponse, PerformanceMetrics } from '../types/dto/reportResponse.interface.js';

/**
 * Porcentaje de servicios finalizados respecto a los agendados, con un decimal.
 * Sin servicios agendados no hay base para calcularlo (null), que no es lo mismo que 0 %.
 */
export const calculateCompletionPercentage = (completed: number, scheduled: number): number | null =>
    scheduled === 0 ? null : Math.round((completed / scheduled) * 1000) / 10;

type PerformanceCounts = Pick<
    BarberPerformance,
    | 'scheduled_appointments'
    | 'completed_appointments'
    | 'scheduled_services'
    | 'completed_services'
    | 'cancelled_services'
    | 'no_show_services'
>;

const toPerformanceMetrics = (counts: PerformanceCounts): PerformanceMetrics => ({
    scheduledAppointments: counts.scheduled_appointments,
    completedAppointments: counts.completed_appointments,
    scheduledServices: counts.scheduled_services,
    completedServices: counts.completed_services,
    cancelledServices: counts.cancelled_services,
    noShowServices: counts.no_show_services,
    pendingServices:
        counts.scheduled_services - counts.completed_services - counts.cancelled_services - counts.no_show_services,
    completionPercentage: calculateCompletionPercentage(counts.completed_services, counts.scheduled_services),
});

export const toBarberPerformanceResponse = (row: BarberPerformance): BarberPerformanceResponse => {
    return {
        barberId: row.barber_id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        assignedShopId: row.assigned_shop_id,
        assignedShopName: row.assigned_shop_name,
        isActive: row.deleted_at === null,
        ...toPerformanceMetrics(row),
    };
};

/**
 * Suma los conteos de varios barberos. El porcentaje se calcula sobre los totales (no es el promedio de los
 * porcentajes individuales, que daría el mismo peso a un barbero con 1 servicio que a uno con 100).
 */
export const toPerformanceTotals = (rows: BarberPerformance[]): PerformanceMetrics => {
    const sum = (pick: (row: BarberPerformance) => number): number => rows.reduce((total, row) => total + pick(row), 0);

    return toPerformanceMetrics({
        scheduled_appointments: sum((row) => row.scheduled_appointments),
        completed_appointments: sum((row) => row.completed_appointments),
        scheduled_services: sum((row) => row.scheduled_services),
        completed_services: sum((row) => row.completed_services),
        cancelled_services: sum((row) => row.cancelled_services),
        no_show_services: sum((row) => row.no_show_services),
    });
};
