/**
 * SedeNoEncontradaError — Error de dominio tipado.
 * 
 * Se lanza cuando no se encuentra una sede por su ID
 * o no hay sedes en el radio de búsqueda.
 */

export class SedeNoEncontradaError extends Error {
  public readonly sedeId?: string;

  constructor(message?: string, sedeId?: string) {
    super(message ?? `Sede no encontrada${sedeId ? `: ${sedeId}` : ''}`);
    this.name = 'SedeNoEncontradaError';
    this.sedeId = sedeId;
    Object.setPrototypeOf(this, SedeNoEncontradaError.prototype);
  }

  get mensajeUsuario(): string {
    return 'No encontramos sedes cercanas. Intenta ampliar el radio de búsqueda.';
  }
}
