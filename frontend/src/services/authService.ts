import { apiClient } from './apiClient';
import type { LoginFormValues, LoginResponse, RegisterFormValues } from '../types/auth';

export const login = async (
  values: LoginFormValues
): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/auth/login', values);

  return response;
};

export const register = async (
  values: RegisterFormValues
): Promise<LoginResponse> => {
  /* confirmPassword es solo para validación del front */
  const { confirmPassword: _confirmPassword, ...payload } = values;

  const response = await apiClient.post<LoginResponse>('/auth/register', payload);

  return response;
};