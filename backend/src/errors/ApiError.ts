export enum ApiErrorCode {
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    ACCOUNT_DEACTIVATED = 403,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    INVALID_CREDENTIALS = 404,
    USER_ALREADY_EXISTS = 409,
    INVALID_INPUT = 422,
    INTERNAL_SERVER_ERROR = 500
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
    field: string;
    detail: string;
};
