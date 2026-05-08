import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '@gymsync/core';

const AccesoDenegado = () => (
  <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', marginTop: '2rem', border: '1px solid #FF5E00', borderRadius: '16px', maxWidth: '600px', margin: '2rem auto' }}>
    <h1 style={{ color: '#FF5E00', margin: '0 0 1rem 0' }}>⛔ Acceso Denegado</h1>
    <p style={{ color: '#E5E5EA' }}>No tienes los permisos suficientes para visualizar este módulo.</p>
  </div>
);

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="layout-loading">Verificando permisos...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Debug Mode Log: Security Guard
    console.warn(`[Security Guard]: Acceso denegado a la ruta ${location.pathname} para el rol ${user.role}.`);
    
    if (user.role === 'CLIENTE') {
      return <AccesoDenegado />;
    }
    
    // Redirigimos a una ruta segura basada en el rol para el resto
    return <Navigate to="/dashboard/auditoria" replace />;
  }

  return <>{children}</>;
};
