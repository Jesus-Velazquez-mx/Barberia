import { ApiError, ApiErrorCode } from '../errors/ApiError.js';
import { getActiveShops, getShopById } from '../repositories/shopRepository.js';
import type { ShopResponse } from '../types/dto/shopResponse.interface.js';
import { toShopResponse } from '../utils/shopMapper.js';

export const listActiveShops = async (): Promise<ShopResponse[]> => {
    const shops = await getActiveShops();
    return shops.map(toShopResponse);
};

export const getActiveShopById = async (id: string): Promise<ShopResponse> => {
    const shop = await getShopById(id);
    
    // Si no existe o está inactiva, devolvemos 404 ya que no debe ser agendable
    if (!shop || !shop.is_active) {
        throw new ApiError(ApiErrorCode.NOT_FOUND, 'Shop not found or is inactive');
    }

    return toShopResponse(shop);
};