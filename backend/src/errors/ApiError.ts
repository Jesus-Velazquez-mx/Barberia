export enum ApiErrorCode {
    UNAUTHORIZED = 401,
    ACCOUNT_DEACTIVATED = 403,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    INVALID_CREDENTIALS = 404,
    USER_ALREADY_EXISTS = 409,
    INVALID_INPUT = 422
}

export class ApiError extends Error {
    constructor(
        public readonly code: ApiErrorCode,
        message: string,
        public readonly details?: unknown
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export type ValidationError = {
    field: string,
    detail: string,
}