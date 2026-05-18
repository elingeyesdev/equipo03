/**
 * ISedesApiService — Puerto de salida para el servicio de API de sedes.
 * 
 * Define el contrato para consultar sedes del backend.
 */

import { Either } from '../../../shared/kernel/Either';
import { Sede } from '../../../domain/entities/Sede.entity';

export interface SedesQueryParams {
  userLat: number;
  userLng: number;
  radius: number; // km
}

export interface ISedesApiService {
  /**
   * Obtiene las sedes del backend, opcionalmente filtradas por proximidad.
   */
  obtenerSedes(params: SedesQueryParams): Promise<Either<Error, Sede[]>>;

  /**
   * Obtiene una sede específica por su ID.
   */
  obtenerSedePorId?(id: string): Promise<Either<Error, Sede>>;
}
