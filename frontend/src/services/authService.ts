import { apiClient } from './apiClient';
import type { LoginFormValues, LoginResponse } from '../types/auth';

export const login = async (
  values: LoginFormValues
): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/login', values);

  return response;
};