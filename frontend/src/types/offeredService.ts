export interface OfferedService {
    id: string;
    categoryId: string;
    name: string;
    description: string | null;
    durationMinutes: number;
    price: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
