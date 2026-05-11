/**
 * AuthService — Servicio de autenticación para la app móvil
 * 
 * Maneja:
 * - Login/Logout
 * - Almacenamiento de token en SecureStore (encriptado)
 * - Decodificación de JWT
 * - Extracción de rol y gym_id
 */

import * as SecureStore from 'expo-secure-store';
import type { AutenticacionContext, UserRole } from '@gymsync/core';

import { Env } from '../geolocation/config/environment';

const AUTH_STORAGE_KEY = 'gymsync.user';
const TOKEN_STORAGE_KEY = 'gymsync.token';
const API_BASE_URL = Env.API_BASE_URL;

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data?: {
    accessToken?: string;
    access_token?: string;
    token?: string;
    user?: Record<string, any>;
  };
  message?: string;
  error?: string;
}

export class AuthService {
  /**
   * Realiza login contra el backend
   */
  static async login(email: string, password: string): Promise<{
    success: boolean;
    user?: AutenticacionContext;
    error?: string;
  }> {
    try {
      console.log('[AuthService] Iniciando login para:', email);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        timeout: 10000,
      });

      console.log('[AuthService] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('[AuthService] Error del servidor:', JSON.stringify(errorData, null, 2));
        const errorMsg = errorData?.message || `HTTP ${response.status}`;
        return { success: false, error: errorMsg };
      }

      const body: LoginResponse = await response.json();
      console.log('[AuthService] Response body:', body);

      // Extraer el token (múltiples formatos soportados)
      const tokenData = body.data || body;
      const jwtToken = tokenData.accessToken || tokenData.access_token || tokenData.token;
      const userData = tokenData.user || {};

      if (!jwtToken) {
        return { success: false, error: 'No se recibió token del servidor' };
      }

      // Decodificar JWT
      let jwtPayload: Record<string, any> = {};
      try {
        const base64Url = jwtToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        jwtPayload = JSON.parse(Buffer.from(base64, 'base64').toString());
      } catch (e) {
        console.warn('[AuthService] Error decodificando JWT:', e);
      }

      // Extraer role
      let extractedRole: UserRole = 'USER';
      if (jwtPayload.role) {
        extractedRole = String(jwtPayload.role).toUpperCase() as UserRole;
      } else if (userData?.role) {
        extractedRole = String(userData.role).toUpperCase() as UserRole;
      } else if (email.includes('admin@')) {
        extractedRole = 'SUPER_ADMIN';
      } else if (email.includes('gerente@')) {
        extractedRole = 'GERENTE';
      }

      // Validar role
      if (!['SUPER_ADMIN', 'GERENTE', 'USER'].includes(extractedRole)) {
        extractedRole = 'USER';
      }

      // Extraer gym_id
      let extractedGymId = userData?.gymId || userData?.gym_id || jwtPayload.gym_id || jwtPayload.gymId;

      // Para GERENTE, gym_id es obligatorio
      if (extractedRole === 'GERENTE' && !extractedGymId) {
        extractedGymId = '1'; // Default fallback
      }

      // Crear contexto de autenticación
      const userId = userData?.id || jwtPayload.sub || jwtPayload.id || email;
      const autenticacionContext: AutenticacionContext = {
        userId,
        role: extractedRole,
        gymId: extractedGymId,
      };

      // Guardar en SecureStore (encriptado)
      await SecureStore.setItemAsync(AUTH_STORAGE_KEY, JSON.stringify(autenticacionContext));
      await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, jwtToken);

      console.log('[AuthService] Login exitoso:', autenticacionContext);
      return { success: true, user: autenticacionContext };
    } catch (error: any) {
      const errorMsg = error?.message || 'Error de conexión con el servidor';
      console.error('[AuthService] Error:', errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Recupera el usuario actual del almacenamiento
   */
  static async getCurrentUser(): Promise<AutenticacionContext | null> {
    try {
      const stored = await SecureStore.getItemAsync(AUTH_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error('[AuthService] Error recuperando usuario:', e);
      return null;
    }
  }

  /**
   * Recupera el token actual
   */
  static async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
    } catch (e) {
      console.error('[AuthService] Error recuperando token:', e);
      return null;
    }
  }

  /**
   * Realiza logout
   */
  static async logout(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY);
      await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
      console.log('[AuthService] Logout completado');
    } catch (e) {
      console.error('[AuthService] Error en logout:', e);
    }
  }

  /**
   * Valida si hay una sesión activa
   */
  static async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    const token = await this.getToken();
    return !!(user && token);
  }
}
