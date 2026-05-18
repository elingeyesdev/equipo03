/**
 * CalcularRutaUseCase — Caso de uso genérico.
 * 
 * Delega la acción técnica de abrir un enlace/mapa a un puerto de salida,
 * garantizando que el Core siga siendo puro TypeScript sin dependencias nativas.
 */

import { Sede } from '../../../domain/entities/Sede.entity';
import { Coordenadas } from '../../../domain/value-objects/Coordenadas.vo';
import { INavigationService } from '../output/INavigationService.port';

export class CalcularRutaUseCase {
  constructor(private readonly navigationService: INavigationService) {}

  /**
   * Abre la app de navegación con la ruta hacia la sede.
   */
  async execute(
    origen: Coordenadas | null,
    destino: Sede
  ): Promise<void> {
    await this.navigationService.abrirNavegacion(origen, destino);
  }

  /**
   * Abre la sede en el navegador de la plataforma.
   */
  async abrirEnNavegador(destino: Sede): Promise<void> {
    await this.navigationService.abrirEnNavegador(destino);
  }
}
