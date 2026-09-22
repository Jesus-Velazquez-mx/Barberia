import type { UserRole } from './user.interface.js';

export type SupplyMovementType = 'in' | 'out';

export interface SupplyMovement {
    id: string;
    supply_id: string;
    movement_type: SupplyMovementType;
    quantity: number;
    unit_cost: number | null;
    reason: string | null;
    performed_by: string | null; // NULL once the user was deleted
    performed_by_name: string; // snapshot filled by DB trigger
    performed_by_role: UserRole; // snapshot filled by DB trigger
    created_at: Date;
}

// performed_by_name/role are set by the trigger; the backend must not send them.
export type CreateSupplyMovementInput = Pick<SupplyMovement, 'supply_id' | 'movement_type' | 'quantity' | 'unit_cost' | 'reason'> & {
    performed_by: string;
};
