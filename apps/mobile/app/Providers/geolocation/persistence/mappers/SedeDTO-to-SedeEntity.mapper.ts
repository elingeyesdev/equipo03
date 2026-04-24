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
  static toDomain(dto: Record<string, unknown>): Sede {
    // Maneja tanto el formato flat (Mock) como el formato anidado (Backend Real)
    const location = dto.location as any || {};
    const address = location.address || dto.direccion;
    const lat = location.latitude ?? dto.latitude;
    const lng = location.longitude ?? dto.longitude;
    const maxCap = dto.maxCapacity ?? dto.aforoMaximo;
    const actualCap = dto.aforoActual ?? 0;
    
    // Mapeo simple de schedules del backend a HorariosMap
    let horariosMap: HorariosMap | undefined = dto.horarios as HorariosMap | undefined;
    if (dto.schedules && Array.isArray(dto.schedules)) {
      horariosMap = {};
      const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
      dto.schedules.forEach(s => {
        const d = days[Number(s.dayOfWeek)];
        if (d) {
          // El backend usa opensAt/closesAt, el mock usaba openTime/closeTime
          const rawApertura = s.opensAt ?? s.openTime;
          const rawCierre = s.closesAt ?? s.closeTime;

          // El backend devuelve '05:00:00' (time) y el VO espera '05:00' (HH:mm)
          const aperturaStr = typeof rawApertura === 'string' ? rawApertura.substring(0, 5) : rawApertura;
          const cierreStr = typeof rawCierre === 'string' ? rawCierre.substring(0, 5) : rawCierre;
          
          horariosMap![d] = { apertura: aperturaStr, cierre: cierreStr };
        }
      });
    }

    return Sede.create({
      id: Identifier.create(dto.id as string | number),
      nombre: (dto.name || dto.nombre) as string,
      direccion: address as string,
      coordenadas: Coordenadas.create({
        latitude: lat as number,
        longitude: lng as number,
      }),
      aforo: Aforo.create({
        maximo: maxCap as number,
        actual: actualCap as number,
      }),
      horarios: horariosMap ? HorariosSede.create(horariosMap) : undefined,
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
