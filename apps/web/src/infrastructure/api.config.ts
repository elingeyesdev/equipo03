import axios from 'axios';
import type { AxiosInstance } from 'axios';

const forceLogout = () => {
  localStorage.removeItem('gymsync_user');
  localStorage.removeItem('gymsync_token');
  sessionStorage.clear();
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

export const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: '/api', // Redirigido internamente por Vite al puerto 3000
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // Request interceptor: Inyectar JWT
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('gymsync_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      console.log(`[Web API] ${config.method?.toUpperCase()} ${config.url}`, config.params);
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor: Manejo de 401
  client.interceptors.response.use(
    (response) => {
      const body = response.data;
      if (body && typeof body === 'object' && 'success' in body) {
        if (body.success === false) {
          forceLogout();
          return Promise.reject(new Error(body.message || 'La API retornó success=false.'));
        }
        if ('data' in body) {
          response.data = body.data;
        }
      }
      return response;
    },
    (error) => {
      console.error('[Web API Error]', error.message);
      if (error.response && error.response.status === 401) {
        forceLogout();
      } else if (error.response?.data?.success === false) {
        forceLogout();
      }
      return Promise.reject(error);
    }
  );

  return client;
};

export const apiClient = createApiClient();
