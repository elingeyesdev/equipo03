/**
 * UbicacionNoDisponibleError — Error de dominio tipado.
 * 
 * Se lanza cuando no se puede obtener la ubicación del usuario
 * por permisos denegados, GPS desactivado, timeout, etc.
 */

export class UbicacionNoDisponibleError extends Error {
  public readonly code: string;
  public readonly originalError?: unknown;

  constructor(
    message: string = 'No se pudo obtener la ubicación del usuario',
    originalError?: unknown,
    code: string = 'UBICACION_NO_DISPONIBLE'
  ) {
    super(message);
    this.name = 'UbicacionNoDisponibleError';
    this.code = code;
    this.originalError = originalError;
    Object.setPrototypeOf(this, UbicacionNoDisponibleError.prototype);
  }

  /**
   * Mensaje amigable para el usuario final.
   */
  get mensajeUsuario(): string {
    switch (this.code) {
      case 'PERMISO_DENEGADO':
        return 'Necesitamos permiso de ubicación para mostrarte sedes cercanas. Actívalo en Configuración.';
      case 'GPS_DESACTIVADO':
        return 'Por favor activa el GPS para encontrar sedes cercanas.';
      case 'TIMEOUT':
        return 'No pudimos obtener tu ubicación. Verifica tu conexión GPS e intenta de nuevo.';
      default:
        return 'No pudimos obtener tu ubicación. Intenta de nuevo.';
    }
  }
}
