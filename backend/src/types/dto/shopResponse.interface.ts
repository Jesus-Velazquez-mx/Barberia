export interface ShopResponse {
    id: string;
    name: string;
    street: string | null;
    postalCode: string | null;
    number: string | null;
    phone: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}