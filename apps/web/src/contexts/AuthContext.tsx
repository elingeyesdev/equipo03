/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { UserRole } from '@gymsync/core';
import { apiClient } from '../infrastructure/api.config';
import { VALID_ROLES, ROLE_ID_TO_NAME } from '../config/rbac.constants';

// ─── Tipo extendido de usuario (solo para la app web) ────────────────────────
// Extiende el contrato mínimo de @gymsync/core con `id` numérico y `roleId`,
// sin modificar el paquete compartido.
export interface WebUser {
  /** ID numérico del usuario (= sub del JWT). Campo único y consistente. */
  id: number;
  /** Nombre del rol en mayúsculas, derivado del JWT. */
  role: UserRole;
  /** ID numérico del rol en la BD (sincronizado con DB_ROLES). */
  roleId: number;
  /** ID del gimnasio asignado. Solo presente en roles con scope de sede. */
  gymId?: string;
  /** Nombre real del usuario, extraído del perfil en el login. */
  firstName?: string;
  /** Apellido real del usuario, extraído del perfil en el login. */
  lastName?: string;
  /** Nombre de la sucursal asignada (solo roles con scope de sede). */
  gymName?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: WebUser | null;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthState>({} as AuthState);

// ─── Helper: decodifica el payload del JWT sin librerías externas ─────────────
function decodeJwtPayload(token: string): Record<string, any> {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return {};
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
  } catch {
    return {};
  }
}

// ─── Helper: normaliza el nombre del rol a un UserRole válido ─────────────────
// Fuente de verdad: campo `role` del JWT firmado por el backend.
// Si no existe, intenta construirlo desde `roleId` usando el mapa de BD.
// Nunca usa heurísticas de email.
function resolveRole(jwtPayload: Record<string, any>, userData: Record<string, any>): UserRole {
  // 1. Campo `role` en el JWT (fuente primaria — asignado por NestJS/Passport)
  let rawRole: string =
    jwtPayload.role ||
    // 2. Array `roles` en el JWT (formato alternativo de algunos guards)
    (Array.isArray(jwtPayload.roles) ? jwtPayload.roles[0] : '') ||
    // 3. Campo `role` en el objeto user devuelto por el endpoint de login
    (typeof userData?.role === 'string' ? userData.role : userData?.role?.name) ||
    '';

  // 4. Si aún no hay nombre, intenta construirlo desde el roleId en el JWT
  if (!rawRole && jwtPayload.roleId) {
    rawRole = ROLE_ID_TO_NAME[Number(jwtPayload.roleId)] || '';
  }

  const normalized = rawRole.toString().toUpperCase();
  return (VALID_ROLES.includes(normalized as UserRole) ? normalized : 'USER') as UserRole;
}

// ─── Helper: resuelve el roleId numérico ─────────────────────────────────────
function resolveRoleId(jwtPayload: Record<string, any>, roleName: UserRole): number {
  // Intenta leer el roleId directo del JWT
  if (jwtPayload.roleId && typeof jwtPayload.roleId === 'number') {
    return jwtPayload.roleId;
  }
  // Construye el inverso del mapa a partir del nombre resuelto
  const entry = Object.entries(ROLE_ID_TO_NAME).find(([, name]) => name === roleName);
  return entry ? Number(entry[0]) : 3; // 3 = USER por defecto
}

// ─── Helper: resuelve gymId SOLO si es necesario para el rol ─────────────────
// Para GERENTE: requiere gymId — no asigna fallback arbitrario.
// Para otros roles: puede ser undefined.
function resolveGymId(jwtPayload: Record<string, any>, userData: Record<string, any>, role: UserRole): string | undefined {
  const raw = jwtPayload.gymId ?? jwtPayload.gym_id ?? userData?.gymId ?? userData?.gym_id;

  if (raw !== undefined && raw !== null) {
    return String(raw);
  }

  // GERENTE sin gymId = identidad incompleta. Retorna undefined (se manejará en el interceptor).
  return undefined;
}

// ─────────────────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<WebUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hidratación real: localStorage como arranque rápido + /auth/me para datos frescos
  useEffect(() => {
    const hydrate = async () => {
      const token      = localStorage.getItem('gymsync_token');
      const storedRaw  = localStorage.getItem('gymsync_user');

      // Sin token → no hay sesión, termina inmediatamente
      if (!token || !storedRaw) {
        setIsLoading(false);
        return;
      }

      // 1. Arranque optimista: muestra UI con datos en caché sin esperar red
      let storedUser: WebUser | null = null;
      try {
        storedUser = JSON.parse(storedRaw);
        setUser(storedUser);
      } catch {
        localStorage.removeItem('gymsync_user');
        setIsLoading(false);
        return;
      }

      // 2. Verificar token y obtener datos frescos del perfil
      try {
        const res     = await apiClient.get('/auth/me');
        const data    = res.data ?? {};
        const profile = data.profile ?? {};

        const refreshedUser: WebUser = {
          ...storedUser!,
          firstName: profile.firstName || data.firstName || storedUser!.firstName || '',
          lastName:  profile.lastName  || data.lastName  || storedUser!.lastName  || '',
          gymName:   data.gymName      || data.gym?.name || storedUser!.gymName   || '',
        };

        setUser(refreshedUser);
        localStorage.setItem('gymsync_user', JSON.stringify(refreshedUser));
      } catch (err: any) {
        // 401 = token expirado → forzar cierre de sesión
        if (err?.response?.status === 401) {
          setUser(null);
          localStorage.removeItem('gymsync_user');
          localStorage.removeItem('gymsync_token');
          sessionStorage.clear();
        }
        // Otro error de red → mantener datos en caché (offline graceful)
      } finally {
        setIsLoading(false);
      }
    };

    hydrate();
  }, []);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 600));

    try {
      const response = await apiClient.post('/auth/login', { email, password: pass });
      const payload = response.data;

      // Extraer token JWT (compatibilidad con naming conventions)
      const jwtToken: string | undefined =
        payload.accessToken || payload.access_token || payload.token;

      if (!jwtToken) {
        throw new Error('El backend no retornó un token válido.');
      }

      const userData: Record<string, any> = payload.user || {};
      const jwtPayload = decodeJwtPayload(jwtToken);

      // ── Resolución de identidad — solo JWT + metadata del backend ────────
      const role = resolveRole(jwtPayload, userData);
      const roleId = resolveRoleId(jwtPayload, role);
      const gymId = resolveGymId(jwtPayload, userData, role);

      // ID numérico del usuario (sub es el estándar JWT de NestJS)
      const id: number = Number(jwtPayload.sub || jwtPayload.id || userData.id || 0);

      // Nombre real desde el perfil devuelto por el backend en el login
      const firstName: string = userData.profile?.firstName || userData.firstName || '';
      const lastName:  string = userData.profile?.lastName  || userData.lastName  || '';
      const gymName:   string = userData.gymName || userData.gym?.name || '';

      const webUser: WebUser = { id, role, roleId, gymId, firstName, lastName, gymName };

      setUser(webUser);
      localStorage.setItem('gymsync_user', JSON.stringify(webUser));
      localStorage.setItem('gymsync_token', jwtToken);

      return { success: true };
    } catch (error: any) {
      if (error.response?.status === 401) {
        return { success: false, error: 'Credenciales inválidas.' };
      }
      const apiMessage = error?.response?.data?.message || error?.message;
      return { success: false, error: apiMessage || 'Error de conexión con el servidor.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('gymsync_user');
    localStorage.removeItem('gymsync_token');
    sessionStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
