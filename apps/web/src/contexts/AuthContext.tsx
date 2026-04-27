/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { AutenticacionContext } from '@gymsync/core';
import type { UserRole } from '@gymsync/core';
import { apiClient } from '../infrastructure/api.config';

interface AuthState {
  isAuthenticated: boolean;
  user: AutenticacionContext | null;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthState>({} as AuthState);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AutenticacionContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restaurar sesión de localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('gymsync_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    // Simulación de retraso de red
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const response = await apiClient.post('/auth/login', { email, password: pass });
      
      // api.config ya desempaqueta el envelope ({ success, data, timestamp }) cuando success=true.
      const payload = response.data;
      
      // Compatibilidad con convenciones comunes: accessToken, access_token o token.
      const jwtToken = payload.accessToken || payload.access_token || payload.token;
      // Algunos backends no envían el objeto user en el login, solo el token
      const userData = payload.user || {};
      
      if (!jwtToken) {
        throw new Error("El backend no retornó un token válido.");
      }

      // Intentar decodificar el JWT (Estándar NestJS/Passport)
      let jwtPayload: any = {};
      try {
        const base64Url = jwtToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        jwtPayload = JSON.parse(window.atob(base64));
      } catch (e) {
        console.warn("Fallo al decodificar JWT", e);
      }

      // Reglas de negocio RBAC (Prioridades)
      let extractedRole = 'USER';
      let extractedGymId = userData?.gymId || userData?.gym_id || jwtPayload.gymId;

      // 1. Hardcode seguro de emergencia basado en el correo (Requerimiento estricto)
      if (email.includes('admin@')) {
        extractedRole = 'SUPER_ADMIN';
      } else if (email.includes('gerente@')) {
        extractedRole = 'GERENTE';
        extractedGymId = extractedGymId || '1'; // Sede por defecto si falla el backend
      } 
      // 2. Extraer del JWT o User Data
      else {
        if (jwtPayload.role) extractedRole = jwtPayload.role;
        else if (Array.isArray(jwtPayload.roles)) extractedRole = jwtPayload.roles[0];
        else if (userData?.role) extractedRole = userData.role?.name || userData.role;
        else if (Array.isArray(userData?.roles)) extractedRole = userData.roles[0]?.name || userData.roles[0]?.role?.name || 'USER';
      }
      
      extractedRole = String(extractedRole).toUpperCase();
      const normalizedRole: UserRole =
        extractedRole === 'SUPER_ADMIN' || extractedRole === 'GERENTE' ? extractedRole : 'USER';

      // Si userData no trae ID, usamos el sub/id del token (estándar JWT)
      const finalUserId = userData.id || jwtPayload.sub || jwtPayload.id || '99';

      const u: AutenticacionContext = { 
        userId: finalUserId, 
        role: normalizedRole, 
        gymId: extractedGymId 
      };
      
      setUser(u);
      localStorage.setItem('gymsync_user', JSON.stringify(u));
      localStorage.setItem('gymsync_token', jwtToken);
      
      return { success: true };
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
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
