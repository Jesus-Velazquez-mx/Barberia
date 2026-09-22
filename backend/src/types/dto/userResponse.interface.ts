import type { User } from '../entities/user.interface.js';

export type UserResponse = Omit<User, 'password_hash' | 'staff_deleted_at'>;
