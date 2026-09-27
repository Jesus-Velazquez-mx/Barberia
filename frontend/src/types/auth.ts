export interface LoginFormValues {
  email: string;
  password: string;
}

export interface RegisterFormValues {
  firstName: string;
  lastName: string;
  phone?: string;
  email: string;
  password: string;
  /* Solo se usa para validar en el front; nunca se envía al backend. */
  confirmPassword: string;
}

export interface User {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  profile: UserProfile;
}

export interface BarberProfile {
  shopId: string;
  shiftId: string;
  bio: string | null;
  isAcceptingBookings: boolean;
}

export interface ManagerProfile {
  title: string | null;
}

export interface ReceptionistProfile {
  shopId: string;
  shiftId: string;
}

export type FacialStructureType =
  | 'oval'
  | 'triangle'
  | 'heart'
  | 'round'
  | 'diamond'
  | 'square'
  | 'rectangle';

export interface ClientProfile {
  facialStructureType: FacialStructureType | null;
  completedServicesCount: number;
}

export type UserProfile =
  | BarberProfile
  | ManagerProfile
  | ReceptionistProfile
  | ClientProfile;

export interface LoginResponse {
  user: User;
  token: string;
}

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (data: LoginResponse) => void;
  logout: () => void;
}

/* Roles de usuarios */
export type UserRole = 'client' | 'barber' | 'manager' | 'receptionist';