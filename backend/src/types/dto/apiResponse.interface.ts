export interface ApiResponse<T> {
    data: T | null;
    message: string;
    error: string[] | null;
}