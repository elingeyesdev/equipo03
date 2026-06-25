/**
 * IDs de roles según el orden de inserción del seeder (RESTART IDENTITY).
 * Índice de la tabla `roles` tras correr seed limpio:
 *  1 SUPER_ADMIN  | 2 GERENTE   | 3 RECEPCIONISTA
 *  4 ENTRENADOR   | 5 NUTRICIONISTA
 *  6 INSTRUCTOR   | 7 COORDINADOR
 *  8 CLIENTE      | 9 PERSONAL_DE_LIMPIEZA
 *
 * Usar estos IDs —no el nombre en string— para lógica de UI/acceso.
 */
export const DB_ROLES = {
  SUPER_ADMIN:         1,
  GERENTE:             2,
  RECEPCIONISTA:       3,
  ENTRENADOR:          4,
  NUTRICIONISTA:       5,
  INSTRUCTOR:          6,
  COORDINADOR:         7,
  CLIENTE:             8,
  PERSONAL_DE_LIMPIEZA: 9,
} as const;

export type DbRoleId = typeof DB_ROLES[keyof typeof DB_ROLES];
