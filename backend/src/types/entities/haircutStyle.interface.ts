import type { FacialStructureType } from './client.interface.js';

export interface HaircutStyle {
    id: string;
    name: string;
    description?: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

/** Estilo de corte junto con las estructuras faciales a las que aplica (tabla haircut_style_facial_structures). */
export interface HaircutStyleWithStructures extends Omit<HaircutStyle, 'description'> {
    description: string | null;
    facial_structures: FacialStructureType[];
}
