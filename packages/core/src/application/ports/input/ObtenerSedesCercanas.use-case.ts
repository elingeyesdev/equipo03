/**
 * ObtenerSedesCercanasUseCase — Caso de uso principal.
 * 
 * Orquesta:
 * 1. Obtener ubicación del usuario (vía puerto de geolocalización)
 * 2. Consultar sedes al backend (vía puerto de API)
 * 3. Calcular distancias con lógica de dominio pura
 * 4. Ordenar por cercanía y limitar resultados
 */

import { Either, left, right } from '../../../shared/kernel/Either';
import { Sede } from '../../../domain/entities/Sede.entity';
import { Coordenadas } from '../../../domain/value-objects/Coordenadas.vo';
import { Distancia } from '../../../domain/value-objects/Distancia.vo';
import { CalculadoraDistancia } from '../../../domain/services/CalculadoraDistancia.service';
import { ISedesApiService } from '../output/ISedesApiService.port';
import { IGeolocationService } from '../output/IGeolocationService.port';
import { UbicacionNoDisponibleError } from '../../../domain/errors/UbicacionNoDisponible.error';

export type ObtenerSedesCercanasRequest = {
  radioKm?: number;       // default: 10 km
  maxResultados?: number;  // default: 20
};

export type SedeConDistancia = {
  sede: Sede;
  distancia: Distancia;
};

export type ObtenerSedesResponse = {
  sedes: SedeConDistancia[];
  ubicacion: Coordenadas;
};

export class ObtenerSedesCercanasUseCase {
  constructor(
    private readonly geolocationService: IGeolocationService,
    private readonly sedesApiService: ISedesApiService,
  ) {}

  async execute(
    request: ObtenerSedesCercanasRequest = {}
  ): Promise<Either<UbicacionNoDisponibleError, ObtenerSedesResponse>> {
    const radioKm = request.radioKm ?? 10;
    const maxResultados = request.maxResultados ?? 20;

    // 1. Solicitar permiso y obtener ubicación del usuario
    const permisoResult = await this.geolocationService.solicitarPermiso();
    if (permisoResult.isLeft()) return permisoResult as Either<UbicacionNoDisponibleError, never>;

    const ubicacionResult = await this.geolocationService.obtenerUbicacionActual({
      enableHighAccuracy: true,
      timeout: 15000,
    });

    if (ubicacionResult.isLeft()) {
      return ubicacionResult as Either<UbicacionNoDisponibleError, never>;
    }

    const userCoords = ubicacionResult.value;

    // 2. Consultar sedes al backend
    const sedesResult = await this.sedesApiService.obtenerSedes({
      userLat: userCoords.latitude,
      userLng: userCoords.longitude,
      radius: radioKm,
    });

    if (sedesResult.isLeft()) {
      return left(new UbicacionNoDisponibleError(
        sedesResult.value.message,
        sedesResult.value,
        'API_ERROR'
      ));
    }

    // 3. Calcular distancias (lógica de dominio pura)
    const sedesConDistancia: SedeConDistancia[] = sedesResult.value.map((sede) => ({
      sede,
      distancia: CalculadoraDistancia.calcular(userCoords, sede.coordenadas),
    }));

    // 4. Ordenar por cercanía y limitar resultados
    const resultado = sedesConDistancia
      .sort((a, b) => a.distancia.metros - b.distancia.metros)
      .slice(0, maxResultados);

    return right({
      sedes: resultado,
      ubicacion: userCoords,
    });
  }

  /**
   * Ejecuta con coordenadas proporcionadas (fallback manual).
   */
  async executeConCoordenadas(
    coordenadas: Coordenadas,
    request: ObtenerSedesCercanasRequest = {}
  ): Promise<Either<Error, ObtenerSedesResponse>> {
    const radioKm = request.radioKm ?? 10;
    const maxResultados = request.maxResultados ?? 20;

    const sedesResult = await this.sedesApiService.obtenerSedes({
      userLat: coordenadas.latitude,
      userLng: coordenadas.longitude,
      radius: radioKm,
    });

    if (sedesResult.isLeft()) return sedesResult as Either<Error, never>;

    const sedesConDistancia: SedeConDistancia[] = sedesResult.value.map((sede) => ({
      sede,
      distancia: CalculadoraDistancia.calcular(coordenadas, sede.coordenadas),
    }));

    const resultado = sedesConDistancia
      .sort((a, b) => a.distancia.metros - b.distancia.metros)
      .slice(0, maxResultados);

    return right({
      sedes: resultado,
      ubicacion: coordenadas,
    });
  }
}
