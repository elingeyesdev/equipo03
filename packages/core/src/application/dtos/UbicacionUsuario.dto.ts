/**
 * UbicacionUsuarioDTO — DTO para la ubicación del usuario.
 */

export interface UbicacionUsuarioDTO {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: Date;
  esValida: boolean;
}
