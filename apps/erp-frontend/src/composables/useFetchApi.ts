import axios, { type AxiosRequestConfig } from 'axios';

// In dev, Vite proxy forwards /api and /internal to the API Gateway.
// In production, use the explicit API base URL.
const API_BASE_URL = import.meta.env.PROD
  ? import.meta.env.VITE_API_BASE_URL || ''
  : '';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => {
    const data = response.data;
    // Backend returns { statusCode: 403, message: '...' } with HTTP 200
    if (data && typeof data.statusCode === 'number') {
      const err = new Error(
        data.message || `Request failed with status ${data.statusCode}`,
      );
      err.name = 'ApiError';
      (err as Error & { statusCode: number }).statusCode = data.statusCode;
      throw err;
    }
    return response;
  },
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'Network error';
    const err = new Error(message);
    err.name = 'ApiError';
    (err as Error & { statusCode?: number }).statusCode =
      error.response?.status;
    throw err;
  },
);

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

export function useFetchApi() {
  async function fetchApi<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response = await client.get(url, config);
    return response.data as ApiResponse<T>;
  }

  async function postApi<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response = await client.post(url, data, config);
    return response.data as ApiResponse<T>;
  }

  async function putApi<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response = await client.put(url, data, config);
    return response.data as ApiResponse<T>;
  }

  async function deleteApi<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response = await client.delete(url, config);
    return response.data as ApiResponse<T>;
  }

  return {
    fetchApi,
    postApi,
    putApi,
    deleteApi,
  };
}
