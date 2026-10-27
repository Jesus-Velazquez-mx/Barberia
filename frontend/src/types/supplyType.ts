/* Insumo de una sucursal (tabla supplies). El stock vive en otra tabla (supply_stock) y aún no tiene endpoint. */
export interface Supply {
    id: string;
    shopId: string;
    categoryId: string;
    name: string;
    description: string | null;
    /* Unidad de medida en texto libre (máx. 30): 'unit', 'bottle', 'box'... */
    unit: string;
    sku: string | null;
    createdAt: string;
    updatedAt: string;
}

/* Sucursal tal como la necesitan los selectores y filtros de insumos. */
export interface SupplyShop {
    id: string;
    name: string;
}

/* Valores del formulario de alta/edición de insumos. */
export interface SupplyFormValues {
    name: string;
    shopId: string;
    categoryId: string;
    unit: string;
    sku: string;
    description: string;
}

/* Lo que se envía al servicio (en el backend: POST /supplies y PUT /supplies/:id). */
export interface SupplyPayload {
    shopId: string;
    categoryId: string;
    name: string;
    description: string | null;
    unit: string;
    sku: string | null;
}
