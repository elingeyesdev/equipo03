/**
 * AuthContext — Context de autenticación para la app móvil
 * 
 * Proporciona:
 * - Estado de autenticación (usuario, token)
 * - Funciones login/logout
 * - Hook useAuth para acceder desde componentes
 */

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { AutenticacionContext } from '@gymsync/core';
import { AuthService } from './AuthService';
import { authEvents } from './authEvents';

interface AuthContextType {
  isAuthenticated: boolean;
  user: AutenticacionContext | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: any) => void;
  clearError: () => void;
}

const AuthContextInstance = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AutenticacionContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Al montar el componente, restaurar la sesión si existe
   */
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const currentUser = await AuthService.getCurrentUser();
        if (currentUser) {
          const userData = await AuthService.fetchUserProfile();
          setUser({ ...currentUser, profile: userData?.profile ?? (currentUser as any).profile ?? undefined });
        }
      } catch (e) {
        console.error('[AuthContext] Error restaurando sesión:', e);
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  useEffect(() => {
    return authEvents.onForceLogout(() => {
      setUser(null);
      setError(null);
    });
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await AuthService.login(email, password);

      if (result.success && result.user) {
        const userData = await AuthService.fetchUserProfile();
        setUser({ ...result.user, profile: userData?.profile ?? undefined });
        return true;
      } else {
        setError(result.error || 'Error al iniciar sesión');
        return false;
      }
    } catch (err: any) {
      const message = err?.message || 'Error desconocido';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await AuthService.logout();
      setUser(null);
      setError(null);
    } catch (err: any) {
      console.error('[AuthContext] Error en logout:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = (data: any) => {
    if (user) {
      setUser({
        ...user,
        profile: {
          ...(user.profile || {}),
          ...data
        }
      });
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    isAuthenticated: !!user,
    user,
    isLoading,
    error,
    login,
    logout,
    updateProfile,
    clearError,
  };

  return (
    <AuthContextInstance.Provider value={value}>
      {children}
    </AuthContextInstance.Provider>
  );
};

/**
 * Hook para acceder al contexto de autenticación
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContextInstance);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
