export interface PerformanceMetrics {
    scheduledAppointments: number;
    completedAppointments: number;
    scheduledServices: number;
    completedServices: number;
    cancelledServices: number;
    noShowServices: number;
    // Aún sin desenlace (scheduled, rescheduled o checked_in). Con los tres anteriores suma scheduledServices.
    pendingServices: number;
    // Servicios finalizados respecto a los agendados (0 a 100); null si no hubo servicios agendados.
    completionPercentage: number | null;
}

export interface BarberPerformanceResponse extends PerformanceMetrics {
    barberId: string;
    firstName: string;
    lastName: string;
    email: string;
    // Sucursal asignada actualmente; puede no ser la evaluada si el barbero fue reasignado.
    assignedShopId: string;
    assignedShopName: string;
    isActive: boolean;
}

export interface BarberPerformanceReportResponse {
    shopId: string;
    shopName: string;
    startDate: string;
    endDate: string;
    totals: PerformanceMetrics;
    barbers: BarberPerformanceResponse[];
}
