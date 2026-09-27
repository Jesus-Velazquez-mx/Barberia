export type FacialStructureType = 'oval' | 'triangle' | 'heart' | 'round' | 'diamond' | 'square' | 'rectangle';

export interface Client {
    user_id: string;
    facial_structure_type: FacialStructureType | null;
    completed_services_count: number;
}