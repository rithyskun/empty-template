export class ApiResponse<T = unknown> {
  success!: boolean;
  message!: string;
  data?: T;
  errors?: unknown[];

  static ok<T>(data: T, message = 'Success'): ApiResponse<T> {
    return { success: true, message, data };
  }

  static fail<T>(message: string, errors?: unknown[]): ApiResponse<T> {
    return { success: false, message, errors };
  }
}
