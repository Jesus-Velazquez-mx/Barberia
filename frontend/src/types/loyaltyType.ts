/* Estado del programa de lealtad de un cliente (GET /clients/:id/loyalty). */
export interface LoyaltyStatus {
    completedServicesCount: number;
    /* Servicios pagados que se requieren para obtener la recompensa. */
    threshold: number;
    appointmentsUntilReward: number;
    /* El contador ya alcanzó el umbral. */
    rewardAvailable: boolean;
    /* Ya hay una cita de recompensa pendiente. */
    hasOpenRewardAppointment: boolean;
    /* true cuando la próxima cita que se agende llevará la recompensa. */
    rewardAppliesOnNextBooking: boolean;
}
