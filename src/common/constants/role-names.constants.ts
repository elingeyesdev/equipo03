/**
 * Nombres canónicos de roles del sistema.
 * Deben coincidir exactamente con la columna `roles.name` en la BD.
 *
 * SUPER_ADMIN  — Acceso total, sin restricción de sede.
 * GERENTE      — Gestiona una o varias sedes.
 * INSTRUCTOR   — Imparte clases grupales con horario fijo.
 * ENTRENADOR   — Asiste en sala libre; no dicta clases programadas.
 * USER         — Cliente estándar del gimnasio.
 */
export const RoleName = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  GERENTE: 'GERENTE',
  INSTRUCTOR: 'INSTRUCTOR',
  ENTRENADOR: 'ENTRENADOR',
  USER: 'USER',
} as const;

export type RoleName = (typeof RoleName)[keyof typeof RoleName];
