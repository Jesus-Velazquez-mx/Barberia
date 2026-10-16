export interface HaircutRecommendation {
    id: string;
    /* Fecha de generación en ISO. */
    createdAt: string;
    /* Foto con la que se generó; null si ya no está disponible. */
    photoUrl: string | null;
    /* Mensaje de preferencias que escribió el cliente. */
    preferences: string;
    /* Texto de la recomendación generada. */
    recommendation: string;
}
