import type { Shop } from '../types/entities/shop.interface.js';
import type { ShopResponse } from '../types/dto/shopResponse.interface.js';

export const toShopResponse = (shop: Shop): ShopResponse => {
    return {
        id: shop.id,
        name: shop.name,
        street: shop.street,
        postalCode: shop.postal_code,
        number: shop.number,
        phone: shop.phone,
        isActive: shop.is_active,
        createdAt: shop.created_at,
        updatedAt: shop.updated_at,
    };
};
