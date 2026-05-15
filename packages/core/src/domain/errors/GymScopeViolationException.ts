/**
 * GymScopeViolationException — Excepción de dominio.
 *
 * Se lanza cuando un actor intenta acceder a datos de un gimnasio
 * fuera de su scope autorizado (ej: Gerente accediendo a datos de otro gym).
 *
 * La UI puede capturar esta excepción para mostrar un mensaje amigable.
 */
export class GymScopeViolationException extends Error {
  readonly code = 'GYM_SCOPE_VIOLATION';
  readonly httpStatus: number;

  constructor(message: string = 'Acceso denegado: operación fuera del scope de tu sede asignada.', httpStatus: number = 403) {
    super(message);
    this.name = 'GymScopeViolationException';
    this.httpStatus = httpStatus;
    // Restaurar prototype chain para instanceof
    Object.setPrototypeOf(this, GymScopeViolationException.prototype);
  }
}
