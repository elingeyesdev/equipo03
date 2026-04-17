/**
 * SedeListDTO — DTO para la lista de sedes con distancia.
 * 
 * Estructura plana para comunicación entre capas (Application → Presentation).
 */

export interface SedeListItemDTO {
  id: string;
  nombre: string;
  direccion: string;
  latitude: number;
  longitude: number;
  aforoMaximo: number;
  aforoActual: number;
  distanciaMetros: number;
  distanciaTexto: string;
  estaDisponible: boolean;
  nivelOcupacion: 'bajo' | 'medio' | 'alto';
  horarios?: Record<string, string>;
  servicios?: string[];
  imagenUrl?: string;
  telefono?: string;
}

export interface SedeListDTO {
  sedes: SedeListItemDTO[];
  total: number;
  radioKm: number;
  timestamp: Date;
}
