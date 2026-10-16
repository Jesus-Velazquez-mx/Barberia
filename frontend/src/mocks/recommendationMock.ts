import type { HaircutRecommendation } from '../types/recommendation';

/* Datos de muestra para maquetar el historial mientras no exista el servicio. */
export const MOCK_RECOMMENDATIONS: HaircutRecommendation[] = [
    {
        id: 'rec-3',
        createdAt: '2026-10-02T16:30:00.000Z',
        photoUrl: null,
        preferences: 'Quiero algo fácil de peinar, sin gastar mucho tiempo en las mañanas.',
        recommendation:
            'Te recomendamos un corte textured crop con degradado bajo en los costados. Tu rostro ovalado admite flequillo corto y texturizado, que además es de bajo mantenimiento. Usa un poco de cera mate para definir.'
    },
    {
        id: 'rec-2',
        createdAt: '2026-08-14T19:05:00.000Z',
        photoUrl: null,
        preferences: 'Me gustaría conservar el largo arriba pero que se vea más ordenado.',
        recommendation:
            'Un pompadour moderno con degradado medio mantiene el volumen arriba y limpia los lados. Recortar 2 cm en la parte superior ayudará a que tu cabello ondulado tenga forma.'
    },
    {
        id: 'rec-1',
        createdAt: '2026-06-21T14:12:00.000Z',
        photoUrl: null,
        preferences: '',
        recommendation:
            'Para tu tipo de cabello grueso, un corte clásico con degradado alto (high fade) y la parte superior peinada hacia un lado es una opción segura y favorecedora.'
    }
];
