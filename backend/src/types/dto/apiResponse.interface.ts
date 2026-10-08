import type { ValidationError } from '../../errors/ApiError.js';

export interface ApiResponse<T> {
    data?: T;
    message: string;
    error?: string[] | ValidationError[];
}
