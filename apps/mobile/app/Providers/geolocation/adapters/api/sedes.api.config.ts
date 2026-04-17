/**
 * Sedes API Config — Configuración de Axios con interceptors.
 */

import axios, { AxiosInstance } from 'axios';
import { Env } from '../../config/environment';

export const createSedesApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: Env.API_BASE_URL,
    timeout: Env.API_TIMEOUT_MS,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // Request interceptor — Log en desarrollo
  client.interceptors.request.use(
    (config) => {
      if (Env.isDevelopment) {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.params);
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor — Manejo centralizado de errores
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (Env.isDevelopment) {
        console.error('[API Error]', error.message);
      }
      return Promise.reject(error);
    }
  );

  return client;
};
