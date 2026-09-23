import type { Request, Response } from 'express';
import type { ApiResponse } from '../types/dto/apiResponse.interface.js';
import { ZodError } from 'zod';

// El tipo que utilizarán todos los controladores
export type ApiHandler<T> = (req: Request, res: Response<ApiResponse<T>>) => Promise<void>;

// Las funciones de ayuda (helpers)
export const sendSuccess = <T>(res: Response<ApiResponse<T>>, data: T, message: string, status = 200) =>
  res.status(status).json({ data, message, error: null });

export const sendFail = <T>(res: Response<ApiResponse<T>>, message: string, errors: string[] | null = null, status = 500) =>
  res.status(status).json({ data: null, message, error: errors });

// TODO - Map Zod error's correctly to show what field is wrong or missing
export const sendValidationError = <T>(res: Response<ApiResponse<T>>, error: ZodError) => {
  sendFail(res, 'Validation error', error.issues.map((issue) => issue.message), 400);
}