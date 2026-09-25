export interface BarberResponse {
    userId: string;
    shopId: string;
    shiftId: string;
    bio: string | null;
    isAcceptingBookings: boolean;
}
