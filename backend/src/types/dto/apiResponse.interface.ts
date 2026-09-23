import { ValidationError } from "../../errors/ApiError.js";

export interface ApiResponse<T> {
    data: T | null;
    message: string;
    error: string[] | ValidationError[] | null;
}
