/**
 * SedeDTOMapper — Mapper de infraestructura.
 * 
 * Convierte los DTOs del backend (estructura plana) a entidades de dominio
 * (objetos ricos con value objects). Desacopla la API externa del dominio.
 */

import { Sede, SedeDTO, ServicioSede, BeneficioSede } from '@gymsync/core';
import { Coordenadas } from '@gymsync/core';
import { Aforo } from '@gymsync/core';
import { HorariosSede, HorariosMap } from '@gymsync/core';
import { Identifier } from '@gymsync/core';

export class SedeDTOMapper {
  /**
   * Convierte un DTO del backend a una entidad de dominio.
   */
  static toDomain(dto: Record<string, unknown>): Sede {
    return Sede.create({
      id: Identifier.create(dto.id as string | number),
      nombre: dto.nombre as string,
      direccion: dto.direccion as string,
      coordenadas: Coordenadas.create({
        latitude: dto.latitude as number,
        longitude: dto.longitude as number,
      }),
      aforo: Aforo.create({
        maximo: dto.aforoMaximo as number,
        actual: dto.aforoActual as number,
      }),
      horarios: dto.horarios ? HorariosSede.create(dto.horarios as HorariosMap) : undefined,
      servicios: dto.servicios as ServicioSede[] | undefined,
      beneficios: dto.beneficios as BeneficioSede[] | undefined,
      imagenUrl: dto.imagenUrl as string | undefined,
      telefono: dto.telefono as string | undefined,
    });
  }

  /**
   * Convierte una entidad de dominio a un DTO plano.
   */
  static toDTO(sede: Sede): SedeDTO {
    return sede.toDTO();
  }

  /**
   * Convierte una lista de DTOs a entidades de dominio.
   */
  static toDomainList(dtos: Record<string, unknown>[]): Sede[] {
    return dtos.map(dto => this.toDomain(dto));
  }
}
