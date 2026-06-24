/**
 * DB_ROLES — Constantes sincronizadas con la tabla `roles` de PostgreSQL.
 * Fuente de verdad única para todos los componentes del frontend web.
 * IDs verificados directamente de la BD.
 *
 * ID  | Nombre                | level | isSystemRole
 *  1  | SUPER_ADMIN           |  10   | true
 *  2  | GERENTE               |   5   | true
 *  3  | USER                  |   1   | false  (rol cliente/socio)
 *  4  | ENTRENADOR            |   3   | true
 *  5  | COORDINADOR           | null  | false
 *  6  | PERSONAL_DE_LIMPIEZA  |   1   | false
 *  7  | INSTRUCTOR            |   3   | false
 *  8  | NUTRICIONISTA         |   3   | true
 *  9  | RECEPCIONISTA         |   4   | false
 * 13  | MANTENIMIENTO         |   4   | false
 */
export const DB_ROLES = {
  SUPER_ADMIN:          1,
  GERENTE:              2,
  USER:                 3,  // rol base para clientes/socios
  CLIENTE:              3,  // alias de USER — no existe rol CLIENTE separado en la BD
  ENTRENADOR:           4,
  INSTRUCTOR:           7,
  NUTRICIONISTA:        8,
  RECEPCIONISTA:        9,
} as const;

export type DbRoleId = (typeof DB_ROLES)[keyof typeof DB_ROLES];

/**
 * Mapa inverso: roleId (number) → nombre del rol (string).
 * Cubre todos los roles actuales de la BD.
 */
export const ROLE_ID_TO_NAME: Record<number, string> = {
  1:  'SUPER_ADMIN',
  2:  'GERENTE',
  3:  'USER',
  4:  'ENTRENADOR',
  5:  'COORDINADOR',
  6:  'PERSONAL_DE_LIMPIEZA',
  7:  'INSTRUCTOR',
  8:  'NUTRICIONISTA',
  9:  'RECEPCIONISTA',
  13: 'MANTENIMIENTO',
};

export const VALID_ROLES = [
  'SUPER_ADMIN',
  'GERENTE',
  'ENTRENADOR',
  'NUTRICIONISTA',
  'CLIENTE',
  'USER',
  'RECEPCIONISTA',
  'INSTRUCTOR',
] as const;
