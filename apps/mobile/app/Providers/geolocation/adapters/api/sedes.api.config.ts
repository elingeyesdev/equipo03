import axios, { AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Env } from '../../config/environment';
import { attach401Guard } from '../../../auth/axios401Guard';

const TOKEN_STORAGE_KEY = 'gymsync.token';

export const createSedesApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: Env.API_BASE_URL,
    timeout: Env.API_TIMEOUT_MS,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // Request interceptor — Inyectar JWT y log en desarrollo
  client.interceptors.request.use(
    async (config) => {
      try {
        // Obtener el token del almacenamiento
        const token = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
        
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
          if (Env.isDevelopment) {
            // token injected
          }
        } else {
          if (Env.isDevelopment) {
            console.warn(`[Sedes API] No hay token disponible. Request sin autenticación.`);
          }
        }
      } catch (e) {
        console.warn('[Sedes API] Error recuperando token:', e);
      }

      if (Env.isDevelopment) {
        // request logged by dev tools
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor — Manejo centralizado de errores y envelope
  client.interceptors.response.use(
    (response) => {
      // Desempaquetar el envelope si existe
      const body = response.data;
      if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
        if (body.success === false) {
          return Promise.reject(
            new Error(body.message || 'API retornó success=false')
          );
        }
        // Reemplazar el data con el contenido del envelope
        response.data = body.data;
      }
      return response;
    },
    (error) => {
      if (Env.isDevelopment) {
        console.warn('[Sedes API Error]', error.message);
        if (error.response?.status === 401) {
          console.warn('[Sedes API] Error 401 Unauthorized - Token inválido o expirado');
        }
        if (error.response?.status === 403) {
          console.warn('[Sedes API] Error 403 Forbidden - No autorizado para este recurso');
        }
      }
      return Promise.reject(error);
    }
  );

  // ── Interceptor global 401 → alerta + logout + redirect al login ─────────────
  attach401Guard(client);

  const { attachOfflineInterceptor } = require('../../../offline/offlineInterceptor');
  attachOfflineInterceptor(client);

  return client;
};

