export interface BarberPerformanceReportRequest {
    shopId: string;
    // Fechas de calendario 'YYYY-MM-DD' en la zona horaria del negocio, ambas inclusivas.
    // Llegan sin validar: el servicio responde con un solo mensaje para cualquier rango inválido.
    startDate?: string;
    endDate?: string;
    // Sin nombre ni apellido se evalúa a todos los barberos de la sucursal.
    firstName?: string;
    lastName?: string;
}
