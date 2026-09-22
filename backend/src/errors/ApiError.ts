export enum ApiErrorCode {
    NOT_FOUND,
    INVALID_CREDENTIALS,
    USER_ALREADY_EXISTS,
    ACCOUNT_DEACTIVATED
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
