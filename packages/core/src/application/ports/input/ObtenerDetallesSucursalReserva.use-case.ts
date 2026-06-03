/**
 * ObtenerDetallesSucursalReservaUseCase — Caso de uso.
 * 
 * Obtiene y centraliza los detalles operacionales de una sucursal para la reserva,
 * incluyendo su aforo, días de operación, horarios de apertura/cierre y actividades/servicios
 * disponibles mediante tipado defensivo estricto.
 */

import { Either, left, right } from '../../../shared/kernel/Either';
import { Sede } from '../../../domain/entities/Sede.entity';
import { ISedesApiService } from '../output/ISedesApiService.port';

export type ObtenerDetallesSucursalRequest = {
  gymId: string;
};

export type DiaHorarioUI = {
  dia: string;
  apertura: string;
  cierre: string;
  cerrado: boolean;
};

export type DetalleSucursalReservaResponse = {
  id: string;
  nombre: string;
  direccion: string;
  aforoMaximo: number;
  aforoActual: number;
  estaDisponible: boolean;
  horariosDeOperacion: DiaHorarioUI[];
  actividadesDisponibles: string[];
};

export class ObtenerDetallesSucursalReservaUseCase {
  constructor(
    private readonly sedesApiService: ISedesApiService,
  ) {}

  async execute(
    request: ObtenerDetallesSucursalRequest
  ): Promise<Either<Error, DetalleSucursalReservaResponse>> {
    if (!request.gymId || request.gymId.trim().length === 0) {
      return left(new Error('El ID del gimnasio es obligatorio'));
    }

    if (!this.sedesApiService.obtenerSedePorId) {
      return left(new Error('El puerto de API no soporta la obtención por ID'));
    }

    // 1. Obtener detalles de la sucursal desde la infraestructura
    const sedeResult = await this.sedesApiService.obtenerSedePorId(request.gymId);

    if (sedeResult.isLeft()) {
      return left(sedeResult.value);
    }

    const sede: Sede = sedeResult.value;

    // 2. Procesar los horarios de operación
    const horariosDeOperacion: DiaHorarioUI[] = [];
    const diasOrdenados = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    
    if (sede.horarios) {
      const rawHorarios = (sede.horarios.raw || {}) as Record<string, any>;
      diasOrdenados.forEach((dia) => {
        const item = rawHorarios[dia];
        if (item) {
          horariosDeOperacion.push({
            dia: dia.charAt(0).toUpperCase() + dia.slice(1),
            apertura: item.apertura || '',
            cierre: item.cierre || '',
            cerrado: !!item.cerrado,
          });
        } else {
          horariosDeOperacion.push({
            dia: dia.charAt(0).toUpperCase() + dia.slice(1),
            apertura: '',
            cierre: '',
            cerrado: true,
          });
        }
      });
    }

    // 3. Procesar las actividades disponibles aplicando tipado defensivo estricto (ignora vacías o nulas)
    const actividadesDisponibles = (sede.servicios || [])
      .map(s => String(s || '').trim())
      .filter(s => s.length > 0);

    // 4. Armar el payload estructurado limpio
    const response: DetalleSucursalReservaResponse = {
      id: sede.id.value,
      nombre: sede.nombre,
      direccion: sede.direccion,
      aforoMaximo: sede.aforo.maximo,
      aforoActual: sede.aforo.actual,
      estaDisponible: sede.estaDisponible,
      horariosDeOperacion,
      actividadesDisponibles,
    };

    return right(response);
  }
}
