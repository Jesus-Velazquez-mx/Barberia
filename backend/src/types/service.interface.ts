export interface Service {
    id: string;
    name: string;
    description: string | null;
    duration_minutes: number;
    price: string; // numeric(10,2) es devuelto como string por pg
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}