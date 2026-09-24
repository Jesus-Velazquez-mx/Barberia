export interface LoginFormValues {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  lastname: string;
  role: UserRole;
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