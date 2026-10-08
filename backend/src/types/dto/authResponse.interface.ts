import type { UserResponse } from './userResponse.interface.js';
import type { ManagerResponse } from './managerResponse.interface.js';
import type { ReceptionistResponse } from './receptionistResponse.interface.js';
import type { ClientResponse } from './clientResponse.interface.js';

// userId is omitted: it's redundant once nested inside `user`, which already has `id`.
// Barbers never authenticate, so BarberResponse never appears here.
export type ProfileResponse =
    Omit<ManagerResponse, 'userId'> | Omit<ReceptionistResponse, 'userId'> | Omit<ClientResponse, 'userId'>;

export interface AuthResponse {
    user: UserResponse & { profile: ProfileResponse };
    token: string;
}
