/** Fila agregada del reporte de desempeño: identificación del barbero y conteos del rango evaluado. */
export interface BarberPerformance {
    barber_id: string;
    first_name: string;
    last_name: string;
    email: string;
    assigned_shop_id: string;
    assigned_shop_name: string;
    deleted_at: Date | null;
    scheduled_appointments: number;
    completed_appointments: number;
    scheduled_services: number;
    completed_services: number;
    cancelled_services: number;
    no_show_services: number;
}
