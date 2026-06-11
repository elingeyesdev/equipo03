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
    const address = location.address || dto.direccion || 'Dirección no especificada';
    const lat = location.latitude ?? dto.latitude ?? 0;
    const lng = location.longitude ?? dto.longitude ?? 0;
    const rawMaxCap = dto.maxCapacity ?? dto.capacity ?? dto.aforoMaximo;
    const maxCap = (typeof rawMaxCap === 'number' && rawMaxCap > 0) ? rawMaxCap : 100;
    const actualCap = dto.aforoActual ?? 0;
    
    // Mapeo simple de schedules del backend a HorariosMap
    let horariosMap: HorariosMap | undefined = dto.horarios as HorariosMap | undefined;
    const rawSched = dto.schedules || dto.gymSchedules;
    if (rawSched && Array.isArray(rawSched)) {
      horariosMap = {};
      const daysByIndex = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
      const daysByName: Record<string, string> = {
        // Abreviados español (formato usado en la BD: gym_schedules.day_of_week)
        DOM: 'domingo', LUN: 'lunes', MAR: 'martes', MIE: 'miercoles',
        JUE: 'jueves',  VIE: 'viernes', SAB: 'sabado',
        // Completos español
        DOMINGO: 'domingo', LUNES: 'lunes', MARTES: 'martes', MIERCOLES: 'miercoles',
        JUEVES: 'jueves', VIERNES: 'viernes', SABADO: 'sabado',
        // Inglés
        SUNDAY: 'domingo', MONDAY: 'lunes', TUESDAY: 'martes', WEDNESDAY: 'miercoles',
        THURSDAY: 'jueves', FRIDAY: 'viernes', SATURDAY: 'sabado',
      };
      (rawSched as any[]).forEach(s => {
        const raw = s.dayOfWeek;
        let d: string | undefined;
        if (typeof raw === 'number') {
          d = daysByIndex[raw];
        } else if (typeof raw === 'string') {
          d = daysByName[raw.toUpperCase()] ?? daysByIndex[Number(raw)];
        }
        if (!d) return;
        const rawApertura = s.opensAt ?? s.openTime ?? s.startTime;
        const rawCierre   = s.closesAt ?? s.closeTime ?? s.endTime;
        const apertura = typeof rawApertura === 'string' ? rawApertura.substring(0, 5) : String(rawApertura ?? '');
        const cierre   = typeof rawCierre   === 'string' ? rawCierre.substring(0, 5)   : String(rawCierre   ?? '');
        if (apertura && cierre) horariosMap![d] = { apertura, cierre };
      });
    }

    // Extracción defensiva de servicios/actividades (ignora nulos, vacíos o estructuras de objetos anidados)
    const rawServicios = dto.servicios || dto.services || dto.activities || dto.gym_activities || dto.gym_activity || [];
    let servicios: ServicioSede[] = [];
    if (Array.isArray(rawServicios)) {
      servicios = rawServicios
        .map(s => (typeof s === 'string' ? s.trim() : (s && typeof s === 'object' && 'name' in s ? String((s as any).name).trim() : '')))
        .filter(s => s.length > 0) as ServicioSede[];
    }

    // Extracción defensiva de beneficios
    const rawBeneficios = dto.beneficios || dto.benefits || [];
    let beneficios: BeneficioSede[] = [];
    if (Array.isArray(rawBeneficios)) {
      beneficios = rawBeneficios
        .map(b => (typeof b === 'string' ? b.trim() : (b && typeof b === 'object' && 'name' in b ? String((b as any).name).trim() : '')))
        .filter(b => b.length > 0) as BeneficioSede[];
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
      servicios,
      beneficios,
      imagenUrl: dto.imagenUrl as string | undefined,
      telefono: dto.telefono as string | undefined,
      parentName: dto.parentName as string | undefined,
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
