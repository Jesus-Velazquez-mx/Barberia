export interface LoginFormValues {
  email: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  lastname: string;
  role: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}