/**
 * Umbral de servicios pagados requeridos para obtener un servicio gratis en el programa de lealtad.
 * Mismo literal (6) que las reglas de negocio y los triggers en `init_database.sql`.
 */
export const LOYALTY_REWARD_THRESHOLD = 6;

export interface RewardEvaluation {
    rewardAvailable: boolean;
    rewardAppliesOnNextBooking: boolean;
}

/**
 * Evalúa de forma pura si el cliente alcanzó la recompensa y si aplica automáticamente en su próxima cita.
 * Es la única fuente de verdad compartida entre el endpoint de lealtad y la transacción de agendado.
 */
export const evaluateReward = (
    completedServicesCount: number,
    hasOpenRewardAppointment: boolean
): RewardEvaluation => {
    const rewardAvailable = completedServicesCount >= LOYALTY_REWARD_THRESHOLD;
    return {
        rewardAvailable,
        rewardAppliesOnNextBooking: rewardAvailable && !hasOpenRewardAppointment,
    };
};
