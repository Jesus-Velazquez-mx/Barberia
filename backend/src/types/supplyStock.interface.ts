export interface SupplyStock {
    supply_id: string;
    quantity_on_hand: number;
    reorder_threshold: number | null;
    needs_reorder: boolean;
    unit_cost: number | null;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}