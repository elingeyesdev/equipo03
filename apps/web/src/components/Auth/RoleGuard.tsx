import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { NAV_ROUTES } from '../../config/roles.config';
import type { UserRole } from '@gymsync/core';

const AccesoDenegado = () => (
  <div
    className="glass-panel"
    style={{
      padding: '2rem',
      textAlign: 'center',
      border: '1px solid #FF5E00',
      borderRadius: '16px',
      maxWidth: '600px',
      margin: '2rem auto',
    }}
  >
    <h1 style={{ color: '#FF5E00', margin: '0 0 1rem 0' }}>⛔ Acceso Denegado</h1>
    <p style={{ color: '#E5E5EA' }}>No tienes los permisos suficientes para visualizar este módulo.</p>
  </div>
);

interface RoleGuardProps {
  children: React.ReactNode;
  /** Ruta relativa (sin /dashboard/) que se está protegiendo, ej: "usuarios" */
  routePath: string;
}


export const RoleGuard: React.FC<RoleGuardProps> = ({ children, routePath }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="layout-loading">Verificando permisos...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Busca la definición de la ruta en el mapa centralizado
  const routeDef = NAV_ROUTES.find(r => r.path === routePath);

  // Si la ruta no está definida en el mapa → bloqueo por omisión (fail-secure)
  if (!routeDef) {
    console.error(`[RoleGuard]: La ruta "${routePath}" no está definida en NAV_ROUTES. Acceso bloqueado.`);
    return <AccesoDenegado />;
  }

  const hasAccess = routeDef.allowedRoles.includes(user.role as UserRole);

  if (!hasAccess) {
    console.warn(
      `[RoleGuard]: Acceso denegado a "${routePath}" para rol "${user.role}". ` +
      `Roles permitidos: [${routeDef.allowedRoles.join(', ')}]`
    );

    // Clientes ven mensaje de Acceso Denegado en lugar de ser redirigidos
    if (user.role === 'CLIENTE') {
      return <AccesoDenegado />;
    }

    // Resto de roles → redirige al resumen del dashboard
    return <Navigate to="/dashboard/resumen" replace />;
  }

  return <>{children}</>;
};
