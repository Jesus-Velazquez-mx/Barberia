import type { Request, Response } from 'express';
import type { ApiResponse } from '../types/dto/apiResponse.interface.js';

// El tipo que utilizarán todos los controladores
export type ApiHandler<T> = (req: Request, res: Response<ApiResponse<T>>) => Promise<void>;

// Las funciones de ayuda (helpers)
export const sendSuccess = <T>(res: Response<ApiResponse<T>>, data: T, message: string, status = 200) =>
  res.status(status).json({ data, message, error: null });

export const sendFail = <T>(res: Response<ApiResponse<T>>, message: string, errors: string[] | null = null, status = 500) =>
  res.status(status).json({ data: null, message, error: errors });