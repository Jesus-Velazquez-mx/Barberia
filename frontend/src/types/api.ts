export interface ApiResponse<T> {
    data?: T;
    message: string;
    error?: string[];
}

export class ApiError extends Error {
    readonly status: number;
    readonly errors: string[];

    constructor(message: string, status: number, errors: string[] = []) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.errors = errors;
    }
}
