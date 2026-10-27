export interface Shop {
    id: string;
    name: string;
    street: string | null;
    postalCode: string | null;
    number: string | null;
    phone: string | null;
    managerId: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
