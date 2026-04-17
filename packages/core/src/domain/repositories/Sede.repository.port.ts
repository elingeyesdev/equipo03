/**
 * SedeRepositoryPort — Puerto (interfaz) del repositorio de Sedes.
 * 
 * Define el contrato que deben cumplir las implementaciones
 * del repositorio (tanto API remota como caché local).
 */

import { Either } from '../../shared/kernel/Either';
import { Sede } from '../entities/Sede.entity';
import { Coordenadas } from '../value-objects/Coordenadas.vo';

export interface SedeRepositoryPort {
  obtenerTodas(): Promise<Either<Error, Sede[]>>;
  obtenerPorId(id: string): Promise<Either<Error, Sede>>;
  obtenerCercanas(
    origen: Coordenadas,
    radioKm: number
  ): Promise<Either<Error, Sede[]>>;
}
