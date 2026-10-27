/* Categoría de insumos (tabla supplies_categories). */
export interface SupplyCategory {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
}

/* Valores del formulario de alta/edición de categorías. */
export interface SupplyCategoryFormValues {
    name: string;
    description: string;
}

/* Lo que se envía al servicio (en el backend: POST /suppliesCategories y PUT /suppliesCategories/:id). */
export interface SupplyCategoryPayload {
    name: string;
    description: string | null;
}
