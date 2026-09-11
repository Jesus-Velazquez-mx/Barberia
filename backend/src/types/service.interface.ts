export interface Service {
    id: string;
    name: string;
    description: string | null;
    duration_minutes: number;
    price: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}