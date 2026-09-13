import type { UserResponse } from './userResponse.interface.js';

export interface AuthResponse {
    user: UserResponse;
    token: string;
}
