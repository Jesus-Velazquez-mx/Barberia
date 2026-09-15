export enum ApiErrorCode {
    NOT_FOUND = 'NOT_FOUND',
    INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
    USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS'
}

export class ApiError extends Error {
    constructor(
        public readonly code: ApiErrorCode,
        public readonly statusCode: number,
        message: string,
        public readonly details?: unknown
    ) {
        super(message);
        this.name = 'ApiError';
    }
}
