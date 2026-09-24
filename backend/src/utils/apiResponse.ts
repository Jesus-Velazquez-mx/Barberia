import type { Request, Response } from 'express';
import type { ApiResponse } from '../types/dto/apiResponse.interface.js';
import { ZodError } from 'zod';
import { ValidationError } from '../errors/ApiError.js';

// El tipo que utilizarán todos los controladores
export type ApiHandler<T> = (req: Request, res: Response<ApiResponse<T>>) => Promise<void>;

// Las funciones de ayuda (helpers)
export const sendSuccess = <T>(res: Response<ApiResponse<T>>, data: T, message: string, status = 200) =>
  res.status(status).json({ data, message });

export const sendFail = <T>(res: Response<ApiResponse<T>>, message: string, status: number, errors?: string[] | ValidationError[]) =>
  res.status(status).json({ message, error: errors });

export const sendValidationError = <T>(res: Response<ApiResponse<T>>, error: ZodError) => {
  sendFail(res, 'Validation error', 400, formatZodError(error));
}

export const sendInternalServerError = <T>(res: Response<ApiResponse<T>>, error: string[], message?: string) => {
  sendFail(res, message ?? 'An unexpected error ocurred', 500, error);
}

function formatZodError(error: ZodError): ValidationError[] {
  return error.issues.map((issue) => {
    const arrayPath = issue.path.toString().split(',');
    return {
      field: arrayPath.pop() ?? '',
      detail: issue.message
    }
  });
}