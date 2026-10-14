export const PAGE_SIZE = 10;

/* Minúsculas y sin acentos, para que "jose" encuentre "José". */
export const normalizeText = (value: string): string =>
    value
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '');

/* true si algún campo contiene el texto buscado. Una búsqueda vacía coincide con todo. */
export function matchesQuery(fields: (string | null)[], query: string): boolean {
    const normalizedQuery = normalizeText(query.trim());
    if (!normalizedQuery) return true;

    return fields.some((field) => field !== null && normalizeText(field).includes(normalizedQuery));
}

export interface PageResult<T> {
    pageItems: T[];
    total: number;
    totalPages: number;
    /* Página efectiva: si se borró el último elemento de la última página, retrocede sola. */
    currentPage: number;
    /* Posición (base 1) del primer y último elemento mostrado; 0 si no hay elementos. */
    from: number;
    to: number;
}

export function paginate<T>(items: T[], page: number, pageSize: number = PAGE_SIZE): PageResult<T> {
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const startIndex = (currentPage - 1) * pageSize;
    const pageItems = items.slice(startIndex, startIndex + pageSize);

    return {
        pageItems,
        total,
        totalPages,
        currentPage,
        from: total === 0 ? 0 : startIndex + 1,
        to: startIndex + pageItems.length
    };
}

/* Números de página a mostrar: una ventana de hasta `maxVisible` páginas alrededor de la actual. */
export function getVisiblePages(currentPage: number, totalPages: number, maxVisible = 5): number[] {
    const visibleCount = Math.min(maxVisible, totalPages);
    let start = Math.max(1, currentPage - Math.floor(visibleCount / 2));
    const end = Math.min(totalPages, start + visibleCount - 1);
    start = Math.max(1, end - visibleCount + 1);

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}
