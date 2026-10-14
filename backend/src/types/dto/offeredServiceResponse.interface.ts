export interface OfferedServicesResponse {
    id: string;
    categoryId: string;
    name: string;
    description: string | null;
    durationMinutes: number;
    price: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}