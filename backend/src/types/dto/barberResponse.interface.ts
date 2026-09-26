export interface BarberResponse {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    shopId: string;
    shiftId: string;
    bio: string | null;
    isAcceptingBookings: boolean;
}
