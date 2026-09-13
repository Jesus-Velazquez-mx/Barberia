export interface Supply {
    id: string;
    shop_id: string;
    category_id: string;
    name: string;
    description: string | null;
    unit: string;
    sku: string | null;
    created_at: Date;
    updated_at: Date;
}