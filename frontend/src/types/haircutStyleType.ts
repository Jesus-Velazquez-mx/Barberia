/* Estructura facial (enum facial_structure_type de la BD). */
export type FacialStructure = 'oval' | 'triangle' | 'heart' | 'round' | 'diamond' | 'square' | 'rectangle';

/* Estilo de corte del catálogo (tabla haircut_styles). El borrado es lógico: isActive = false. */
export interface HaircutStyle {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    facialStructures: FacialStructure[];
    createdAt: string;
    updatedAt: string;
}

/* Valores del formulario de alta/edición. El estado viaja como texto por el <select>. */
export interface HaircutStyleFormValues {
    name: string;
    description: string;
    facialStructures: FacialStructure[];
    isActive: 'true' | 'false';
}

/* Lo que se envía al backend (POST /haircuts y PUT /haircuts/:id). isActive solo se envía al editar. */
export interface HaircutStylePayload {
    name: string;
    description: string | null;
    facialStructures: FacialStructure[];
    isActive?: boolean;
}

/* Tipos de imagen que acepta el backend para la foto de catálogo de un corte. */
export type HaircutImageContentType = 'image/jpeg' | 'image/png' | 'image/webp';
