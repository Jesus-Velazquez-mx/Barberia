export interface CreateServiceRequest {
    categoryId: string;
    name: string;
    description?: string | null;
    durationMinutes: number;
    price: number;
    isActive?: boolean;
}

export interface UpdateServiceRequest {
    categoryId?: string;
    name?: string;
    description?: string | null;
    durationMinutes?: number;
    price?: number;
    isActive?: boolean;
}
