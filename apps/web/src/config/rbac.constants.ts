/**
 * DB_ROLES — Constantes sincronizadas con la tabla `roles` de PostgreSQL.
 * Fuente de verdad única para todos los componentes del frontend web.
 * NO modificar sin actualizar la base de datos primero.
 */
export const DB_ROLES = {
  SUPER_ADMIN: 99,
  NUTRICIONISTA: 6,
  ENTRENADOR: 5,
  GERENTE: 2,
  CLIENTE: 1,
  USER: 3, // Rol por defecto / sin rol asignado
} as const;

export type DbRoleId = (typeof DB_ROLES)[keyof typeof DB_ROLES];

/**
 * Mapa inverso: roleId (number) → nombre del rol (string).
 * Permite normalizar el rol recibido del JWT sin heurísticas de email.
 */
export const ROLE_ID_TO_NAME: Record<number, string> = {
  [DB_ROLES.SUPER_ADMIN]: 'SUPER_ADMIN',
  [DB_ROLES.NUTRICIONISTA]: 'NUTRICIONISTA',
  [DB_ROLES.ENTRENADOR]: 'ENTRENADOR',
  [DB_ROLES.GERENTE]: 'GERENTE',
  [DB_ROLES.CLIENTE]: 'CLIENTE',
  [DB_ROLES.USER]: 'USER',
};

export const VALID_ROLES = [
  'SUPER_ADMIN',
  'GERENTE',
  'ENTRENADOR',
  'NUTRICIONISTA',
  'CLIENTE',
  'USER',
  'RECEPCIONISTA',
] as const;
