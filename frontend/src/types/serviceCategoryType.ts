/* Categoría de servicios (tabla services_categories). El borrado es lógico: is_active = false. */
export interface ServiceCategory {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

/* Valores del formulario de alta/edición de categorías. El estado viaja como texto por el <select>. */
export interface ServiceCategoryFormValues {
    name: string;
    description: string;
    isActive: 'true' | 'false';
}

/* Lo que se envía al servicio (en el backend: POST /servicesCategories y PUT /servicesCategories/:id). */
export interface ServiceCategoryPayload {
    name: string;
    description: string | null;
    isActive: boolean;
}
