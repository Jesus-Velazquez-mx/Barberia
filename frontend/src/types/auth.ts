export interface LoginFormValues {
  email: string;
  password: string;
}

export interface RegisterFormValues {
  name: string;
  lastname: string;
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
}

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