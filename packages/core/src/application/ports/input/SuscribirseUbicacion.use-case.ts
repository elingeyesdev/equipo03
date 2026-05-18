/**
 * SuscribirseUbicacionUseCase — Caso de uso para seguimiento en tiempo real.
 * 
 * Permite suscribirse a actualizaciones continuas de la ubicación del usuario.
 */

import { IGeolocationService } from '../output/IGeolocationService.port';
import { Coordenadas } from '../../../domain/value-objects/Coordenadas.vo';
import { UbicacionNoDisponibleError } from '../../../domain/errors/UbicacionNoDisponible.error';

export class SuscribirseUbicacionUseCase {
  constructor(
    private readonly geolocationService: IGeolocationService,
  ) {}

  /**
   * Inicia el seguimiento de ubicación.
   * @returns Función para cancelar la suscripción.
   */
  execute(
    onUbicacionActualizada: (coordenadas: Coordenadas) => void,
    onError: (error: UbicacionNoDisponibleError) => void,
    options?: { distanceFilter?: number; interval?: number }
  ): () => void {
    return this.geolocationService.suscribirseAUbicacion(
      onUbicacionActualizada,
      onError,
      {
        distanceFilter: options?.distanceFilter ?? 10,
        interval: options?.interval ?? 5000,
      }
    );
  }
}
