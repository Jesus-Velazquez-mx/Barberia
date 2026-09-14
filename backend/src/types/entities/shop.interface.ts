export interface Shop {
    id: string;
    name: string;
    street: string | null;
    postal_code: string | null;
    number: string | null;
    phone: string | null;
    manager_id: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}