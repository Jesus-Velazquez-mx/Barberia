export enum ApiErrorCode {
    NOT_FOUND = 404,
    INVALID_CREDENTIALS = 404,
    USER_ALREADY_EXISTS = 409,
    ACCOUNT_DEACTIVATED = 403
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