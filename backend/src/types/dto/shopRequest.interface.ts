export interface CreateShopRequest {
    name: string;
    street?: string | null;
    postalCode?: string | null;
    number?: string | null;
    phone?: string | null;
    managerId?: string;
    isActive?: boolean;
}

export interface UpdateShopRequest {
    name?: string;
    street?: string | null;
    postalCode?: string | null;
    number?: string | null;
    phone?: string | null;
    managerId?: string;
    isActive?: boolean;
}
