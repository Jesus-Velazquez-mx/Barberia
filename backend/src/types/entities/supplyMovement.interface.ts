export type SupplyMovementType = 'in' | 'out';

export interface SupplyMovement {
    id: string;
    supply_id: string;
    movement_type: SupplyMovementType;
    quantity: number;
    unit_cost: number | null;
    reason: string | null;
    // Always a receptionist or manager, both soft-deleted (never hard-deleted), so
    // this never goes NULL and needs no name/role snapshot the way appointments do.
    performed_by: string;
    created_at: Date;
}

export type CreateSupplyMovementInput = Pick<SupplyMovement, 'supply_id' | 'movement_type' | 'quantity' | 'unit_cost' | 'reason'> & {
    performed_by: string;
};
