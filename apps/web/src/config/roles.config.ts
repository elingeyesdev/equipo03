/**
 * roles.config.ts — Mapa de rutas y privilegios del dashboard.
 *
 * FUENTE DE VERDAD ÚNICA para:
 *   - El sidebar (DashboardLayout.tsx) — qué links aparecen en el DOM.
 *   - El RoleGuard (RoleGuard.tsx)     — qué rutas se montan en el árbol.
 *
 * Para añadir/quitar permisos, edita SOLO este archivo.
 */
import type { UserRole } from '@gymsync/core';

export interface NavRoute {
  /** Segmento de ruta relativo al /dashboard/ */
  path: string;
  /** Etiqueta visible en el sidebar */
  label: string;
  /** Emoji/ícono */
  icon: string;
  /** Roles que pueden acceder. Si el usuario no tiene uno de estos, no se monta. */
  allowedRoles: UserRole[];
}

/**
 * Todas las rutas del dashboard en orden de aparición en el sidebar.
 * La propiedad `allowedRoles` es la misma lista que consume RoleGuard.
 */
export const NAV_ROUTES: NavRoute[] = [
  {
    path: 'resumen',
    label: 'Resumen',
    icon: '📊',
    allowedRoles: ['SUPER_ADMIN', 'GERENTE', 'ENTRENADOR', 'NUTRICIONISTA', 'CLIENTE', 'USER'],
  },
  {
    path: 'auditoria',
    label: 'Auditoría',
    icon: '🛡️',
    allowedRoles: ['SUPER_ADMIN', 'GERENTE'],
  },
  {
    path: 'usuarios',
    label: 'Usuarios',
    icon: '👥',
    allowedRoles: ['SUPER_ADMIN', 'GERENTE', 'ENTRENADOR', 'NUTRICIONISTA'],
  },
  {
    path: 'sedes',
    label: 'Sedes (Marcas)',
    icon: '🏢',
    allowedRoles: ['SUPER_ADMIN'],
  },
  {
    path: 'sucursales',
    label: 'Sucursales',
    icon: '🏪',
    allowedRoles: ['SUPER_ADMIN'],
  },
  {
    path: 'roles',
    label: 'Roles',
    icon: '🔑',
    allowedRoles: ['SUPER_ADMIN'],
  },
  {
    path: 'mapa',
    label: 'Mapa de Red',
    icon: '🌐',
    allowedRoles: ['SUPER_ADMIN'],
  },
  {
    path: 'rutinas',
    label: 'Rutinas',
    icon: '🏋️',
    allowedRoles: ['SUPER_ADMIN', 'ENTRENADOR', 'NUTRICIONISTA', 'CLIENTE'],
  },
  {
    path: 'reservas',
    label: 'Reservas',
    icon: '📅',
    allowedRoles: ['SUPER_ADMIN', 'GERENTE', 'CLIENTE'],
  },
  {
    path: 'medidas',
    label: 'Medidas',
    icon: '📏',
    allowedRoles: ['CLIENTE'],
  },
];

/** Helper: devuelve solo las rutas visibles para un rol dado. */
export const getRoutesForRole = (role: UserRole | undefined): NavRoute[] => {
  if (!role) return [];
  return NAV_ROUTES.filter(r => r.allowedRoles.includes(role));
};
