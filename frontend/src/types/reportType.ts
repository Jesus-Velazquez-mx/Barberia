/* Valores del formulario. Las fechas son texto dd/mm/aaaa (ver utils/dateFormat). */
export interface ReportFormValues {
    firstName: string;
    lastName: string;
    shopId: string;
    startDate: string;
    endDate: string;
}

/* Parámetros de GET /reports/barber-performance. Fechas en YYYY-MM-DD. */
export interface BarberPerformanceQuery {
    shopId: string;
    startDate: string;
    endDate: string;
    firstName?: string;
    lastName?: string;
}

export interface PerformanceMetrics {
    scheduledAppointments: number;
    completedAppointments: number;
    scheduledServices: number;
    completedServices: number;
    cancelledServices: number;
    noShowServices: number;
    /* Aún sin desenlace (agendados, reagendados o con check-in). Con los tres anteriores suma scheduledServices. */
    pendingServices: number;
    /* 0 a 100; null si no hubo servicios agendados en el rango. */
    completionPercentage: number | null;
}

export interface BarberPerformance extends PerformanceMetrics {
    barberId: string;
    firstName: string;
    lastName: string;
    email: string;
    assignedShopId: string;
    assignedShopName: string;
    isActive: boolean;
}

/* Coincide con la respuesta del backend (GET /reports/barber-performance). */
export interface BarberPerformanceReport {
    shopId: string;
    shopName: string;
    startDate: string;
    endDate: string;
    totals: PerformanceMetrics;
    barbers: BarberPerformance[];
}
