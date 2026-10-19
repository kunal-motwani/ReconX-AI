import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errorCode?: string;
  meta?: any;
}

export const sendSuccess = <T>(res: Response, data: T, message?: string, statusCode = 200, meta?: any): Response => {
  const response: ApiResponse<T> = {
    success: true,
    ...(message ? { message } : {}),
    data,
    ...(meta ? { meta } : {})
  };
  return res.status(statusCode).json(response);
};

export const sendError = (res: Response, message: string, statusCode = 400, errorCode?: string): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    ...(errorCode ? { errorCode } : {})
  };
  return res.status(statusCode).json(response);
};
