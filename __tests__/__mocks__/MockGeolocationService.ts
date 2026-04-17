/**
 * Mock de IGeolocationService para tests.
 */

import { IGeolocationService, GeolocationOptions } from '../../src/modules/geolocation/application/ports/output/IGeolocationService.port';
import { Either, left, right } from '../../src/shared/kernel/Either';
import { Coordenadas } from '../../src/modules/geolocation/domain/value-objects/Coordenadas.vo';
import { UbicacionNoDisponibleError } from '../../src/modules/geolocation/domain/errors/UbicacionNoDisponible.error';

export class MockGeolocationService implements IGeolocationService {
  private mockUbicacion: Coordenadas | null = null;
  private mockError: UbicacionNoDisponibleError | null = null;
  private permisoGranted = true;

  // Métodos de configuración para tests
  setUbicacionMock(props: { latitude: number; longitude: number }): void {
    this.mockUbicacion = Coordenadas.create(props);
    this.mockError = null;
  }

  setErrorMock(error: UbicacionNoDisponibleError): void {
    this.mockError = error;
    this.mockUbicacion = null;
  }

  setPermisoDenegado(): void {
    this.permisoGranted = false;
  }

  // Implementación del puerto
  async solicitarPermiso(): Promise<Either<UbicacionNoDisponibleError, boolean>> {
    if (!this.permisoGranted) {
      return left(new UbicacionNoDisponibleError('Permiso denegado', undefined, 'PERMISO_DENEGADO'));
    }
    return right(true);
  }

  async obtenerUbicacionActual(
    _options?: GeolocationOptions
  ): Promise<Either<UbicacionNoDisponibleError, Coordenadas>> {
    if (this.mockError) {
      return left(this.mockError);
    }
    if (this.mockUbicacion) {
      return right(this.mockUbicacion);
    }
    return left(new UbicacionNoDisponibleError('No hay ubicación mock configurada'));
  }

  suscribirseAUbicacion(
    _onSuccess: (coordenadas: Coordenadas) => void,
    _onError: (error: UbicacionNoDisponibleError) => void,
    _options?: { distanceFilter?: number; interval?: number }
  ): () => void {
    // No-op en tests
    return () => {};
  }
}
