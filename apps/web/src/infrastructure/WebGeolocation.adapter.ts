import type { IGeolocationService, GeolocationOptions, Either } from '@gymsync/core';
import { Coordenadas, right, left, UbicacionNoDisponibleError } from '@gymsync/core';

export class WebGeolocationAdapter implements IGeolocationService {
  async solicitarPermiso(): Promise<Either<UbicacionNoDisponibleError, boolean>> {
    try {
      if (!navigator.geolocation) {
        return left(new UbicacionNoDisponibleError('Navegador', 'No soportado'));
      }
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(right(true)),
          (error) => resolve(left(new UbicacionNoDisponibleError(error.message))),
          { enableHighAccuracy: true }
        );
      });
    } catch {
      return left(new UbicacionNoDisponibleError('Permiso Denegado'));
    }
  }

  async obtenerUbicacionActual(
    options?: GeolocationOptions
  ): Promise<Either<UbicacionNoDisponibleError, Coordenadas>> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        return resolve(left(new UbicacionNoDisponibleError('Navegador no soporta Geolocation')));
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve(right(Coordenadas.create({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })));
        },
        (error) => resolve(left(new UbicacionNoDisponibleError(error.message))),
        options
      );
    });
  }

  suscribirseAUbicacion(
    onSuccess: (coordenadas: Coordenadas) => void,
    onError: (error: UbicacionNoDisponibleError) => void,
    options?: { distanceFilter?: number; interval?: number }
  ): () => void {
    if (!navigator.geolocation) {
      onError(new UbicacionNoDisponibleError('Navegador no soporta Geolocation'));
      return () => {};
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        onSuccess(Coordenadas.create({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
      },
      (error) => onError(new UbicacionNoDisponibleError(error.message)),
      { enableHighAccuracy: true, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }
}
