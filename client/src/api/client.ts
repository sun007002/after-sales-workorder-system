/**
 * Axios HTTP client instance with interceptors.
 * Request interceptor: adds Authorization header.
 * Response interceptor: handles 401 (redirect to login) and error formatting.
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/** Axios instance configured with base URL and JSON content type. */
export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

/**
 * Request interceptor: attaches JWT token from localStorage.
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

/**
 * Response interceptor: handles authentication errors and extracts error messages.
 */
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<{ message?: string }>) => {
    if (error.response) {
      const { status, data } = error.response;

      // On 401, clear auth and redirect to login.
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('permissions');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }

      const message = data?.message || '请求失败，请稍后重试';
      return Promise.reject(new Error(message));
    }

    if (error.request) {
      return Promise.reject(new Error('网络错误，请检查网络连接'));
    }

    return Promise.reject(error);
  },
);

export default apiClient;
