export interface IBaseResponse<T> {
  data: T | null;
  success: boolean;
  message: string;
  error?: string;
}

export interface IApiResponse<T> {
  data: T;
  message?: string;
}

export interface IErrorResponse {
  error: string;
  message: string;
  status: number;
}
