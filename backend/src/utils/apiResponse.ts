import type { Request, Response } from 'express';
import type { ApiResponse } from '../types/dto/apiResponse.interface.js';
import { ZodError } from 'zod';
import { ValidationError } from '../errors/ApiError.js';

// El tipo que utilizarán todos los controladores
export type ApiHandler<T> = (req: Request, res: Response<ApiResponse<T>>) => Promise<void>;

// Las funciones de ayuda (helpers)

interface SendSucessProps<T> {
  res: Response<ApiResponse<T>>;
  message: string;
  data?: T;
  status?: number
}

export const sendSuccess = <T>({ res, message, data, status = 200 }: SendSucessProps<T>) =>
  res.status(status).json({ data, message });

interface SendFailProps<T> {
  res: Response<ApiResponse<T>>;
  message: string;
  errors?: string[] | ValidationError[];
  status: number
}

export const sendFail = <T>({ res, message, errors, status }: SendFailProps<T>) =>
  res.status(status).json({ message, error: errors });

export const sendValidationError = <T>({ res, error }: { res: Response<ApiResponse<T>>, error: ZodError }) =>
  sendFail({ res: res, message: 'Validation error', errors: formatZodError(error), status: 400 });

export const sendInternalServerError = <T>(
  { res, error, message = 'An unexpected error ocurred' }: 
  { res: Response<ApiResponse<T>>, error: string[], message?: string }) =>
  sendFail({ res: res, message: message, errors: error, status: 500 });


function formatZodError(error: ZodError): ValidationError[] {
  return error.issues.map((issue) => {
    const arrayPath = issue.path.toString().split(',');
    return {
      field: arrayPath.pop() ?? '',
      detail: issue.message
    }
  });
}