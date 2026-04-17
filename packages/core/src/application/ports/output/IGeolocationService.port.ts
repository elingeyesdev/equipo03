/**
 * IGeolocationService — Puerto de salida para servicios de geolocalización.
 * 
 * Define el contrato que deben cumplir los adaptadores de geolocalización
 * (expo-location, react-native-geolocation, etc.)
 */

import { Either } from '../../../shared/kernel/Either';
import { Coordenadas } from '../../../domain/value-objects/Coordenadas.vo';
import { UbicacionNoDisponibleError } from '../../../domain/errors/UbicacionNoDisponible.error';

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export interface IGeolocationService {
  /**
   * Solicita permiso de ubicación al usuario.
   */
  solicitarPermiso(): Promise<Either<UbicacionNoDisponibleError, boolean>>;

  /**
   * Obtiene la ubicación actual del dispositivo.
   */
  obtenerUbicacionActual(
    options?: GeolocationOptions
  ): Promise<Either<UbicacionNoDisponibleError, Coordenadas>>;

  /**
   * Se suscribe a actualizaciones continuas de ubicación.
   * Retorna una función para cancelar la suscripción.
   */
  suscribirseAUbicacion(
    onSuccess: (coordenadas: Coordenadas) => void,
    onError: (error: UbicacionNoDisponibleError) => void,
    options?: { distanceFilter?: number; interval?: number }
  ): () => void;
}
