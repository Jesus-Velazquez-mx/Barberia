export type ShiftName = 'morning' | 'afternoon';

export interface Shift {
    id: string;
    name: ShiftName;
    start_time: string;
    end_time: string;
    created_at: Date;
    updated_at: Date;
}