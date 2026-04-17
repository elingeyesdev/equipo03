/**
 * MockSedesApiAdapter — Adaptador mock de API para desarrollo.
 * 
 * Retorna sedes hardcodeadas de Santa Cruz de la Sierra, Bolivia.
 * Se usa mientras el backend no esté disponible.
 */

import { ISedesApiService, SedesQueryParams } from '@gymsync/core';
import { Either, right } from '@gymsync/core';
import { Sede } from '@gymsync/core';
import { Coordenadas } from '@gymsync/core';
import { Aforo } from '@gymsync/core';
import { HorariosSede, HorariosMap } from '@gymsync/core';
import { ServicioSede, BeneficioSede } from '@gymsync/core';
import { Identifier } from '@gymsync/core';

// Sedes reales de gimnasios en Santa Cruz de la Sierra
const MOCK_SEDES_DATA = [
  {
    id: '1',
    nombre: 'GymSync Equipetrol',
    direccion: 'Av. San Martín #1200, Equipetrol, Santa Cruz',
    latitude: -17.7634,
    longitude: -63.1962,
    aforoMaximo: 120,
    aforoActual: 45,
    horarios: {
      lunes: { apertura: '05:00', cierre: '23:00' },
      martes: { apertura: '05:00', cierre: '23:00' },
      miercoles: { apertura: '05:00', cierre: '23:00' },
      jueves: { apertura: '05:00', cierre: '23:00' },
      viernes: { apertura: '05:00', cierre: '23:00' },
      sabado: { apertura: '06:00', cierre: '20:00' },
      domingo: { apertura: '07:00', cierre: '14:00' },
    } as HorariosMap,
    servicios: ['Musculación', 'Crossfit', 'Yoga', 'Pilates'] as ServicioSede[],
    beneficios: ['WiFi', 'Duchas', 'Sauna', 'Cafetería', 'Parqueo'] as BeneficioSede[],
    telefono: '+591 3 3456789',
  },
  {
    id: '2',
    nombre: 'GymSync Centro',
    direccion: 'Calle Junín #345, Centro, Santa Cruz',
    latitude: -17.7833,
    longitude: -63.1821,
    aforoMaximo: 80,
    aforoActual: 72,
    horarios: {
      lunes: { apertura: '06:00', cierre: '22:00' },
      martes: { apertura: '06:00', cierre: '22:00' },
      miercoles: { apertura: '06:00', cierre: '22:00' },
      jueves: { apertura: '06:00', cierre: '22:00' },
      viernes: { apertura: '06:00', cierre: '22:00' },
      sabado: { apertura: '07:00', cierre: '18:00' },
      domingo: { cerrado: true, apertura: '', cierre: '' },
    } as HorariosMap,
    servicios: ['Musculación', 'Artes Marciales'] as ServicioSede[],
    beneficios: ['WiFi', 'Duchas', 'Armarios'] as BeneficioSede[],
    telefono: '+591 3 3345678',
  },
  {
    id: '3',
    nombre: 'GymSync Plan 3000',
    direccion: 'Av. Virgen de Cotoca #890, Plan 3000, Santa Cruz',
    latitude: -17.8105,
    longitude: -63.1354,
    aforoMaximo: 100,
    aforoActual: 30,
    horarios: {
      lunes: { apertura: '05:30', cierre: '22:00' },
      martes: { apertura: '05:30', cierre: '22:00' },
      miercoles: { apertura: '05:30', cierre: '22:00' },
      jueves: { apertura: '05:30', cierre: '22:00' },
      viernes: { apertura: '05:30', cierre: '22:00' },
      sabado: { apertura: '06:00', cierre: '20:00' },
      domingo: { apertura: '07:00', cierre: '13:00' },
    } as HorariosMap,
    servicios: ['Musculación', 'Crossfit', 'Zumba'] as ServicioSede[],
    beneficios: ['WiFi', 'Duchas', 'Parqueo'] as BeneficioSede[],
    telefono: '+591 3 3567890',
  },
  {
    id: '4',
    nombre: 'GymSync Urbarí',
    direccion: 'Av. Busch #456, Urbarí, Santa Cruz',
    latitude: -17.7756,
    longitude: -63.1678,
    aforoMaximo: 60,
    aforoActual: 58,
    horarios: {
      lunes: { apertura: '06:00', cierre: '21:00' },
      martes: { apertura: '06:00', cierre: '21:00' },
      miercoles: { apertura: '06:00', cierre: '21:00' },
      jueves: { apertura: '06:00', cierre: '21:00' },
      viernes: { apertura: '06:00', cierre: '21:00' },
      sabado: { apertura: '07:00', cierre: '17:00' },
      domingo: { cerrado: true, apertura: '', cierre: '' },
    } as HorariosMap,
    servicios: ['Musculación'] as ServicioSede[],
    beneficios: ['WiFi', 'Duchas'] as BeneficioSede[],
    telefono: '+591 3 3234567',
  },
  {
    id: '5',
    nombre: 'GymSync Radial 26',
    direccion: 'Radial 26 #1500, entre 3er y 4to anillo, Santa Cruz',
    latitude: -17.7945,
    longitude: -63.2087,
    aforoMaximo: 150,
    aforoActual: 67,
    horarios: {
      lunes: { apertura: '05:00', cierre: '23:00' },
      martes: { apertura: '05:00', cierre: '23:00' },
      miercoles: { apertura: '05:00', cierre: '23:00' },
      jueves: { apertura: '05:00', cierre: '23:00' },
      viernes: { apertura: '05:00', cierre: '23:00' },
      sabado: { apertura: '06:00', cierre: '21:00' },
      domingo: { apertura: '07:00', cierre: '15:00' },
    } as HorariosMap,
    servicios: ['Musculación', 'Crossfit', 'Yoga', 'Pilates', 'Natación'] as ServicioSede[],
    beneficios: ['WiFi', 'Duchas', 'Sauna', 'Cafetería', 'Parqueo'] as BeneficioSede[],
    telefono: '+591 3 3678901',
  },
];

export class MockSedesApiAdapter implements ISedesApiService {
  // Simular latencia de red
  private readonly SIMULATED_DELAY_MS = 800;

  async obtenerSedes(_params: SedesQueryParams): Promise<Either<Error, Sede[]>> {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, this.SIMULATED_DELAY_MS));

    const sedes = MOCK_SEDES_DATA.map(data =>
      Sede.create({
        id: Identifier.create(data.id),
        nombre: data.nombre,
        direccion: data.direccion,
        coordenadas: Coordenadas.create({
          latitude: data.latitude,
          longitude: data.longitude,
        }),
        aforo: Aforo.create({
          maximo: data.aforoMaximo,
          actual: data.aforoActual,
        }),
        horarios: HorariosSede.create(data.horarios),
        servicios: data.servicios,
        beneficios: data.beneficios,
        telefono: data.telefono,
      })
    );

    return right(sedes);
  }

  async obtenerSedePorId(id: string): Promise<Either<Error, Sede>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const data = MOCK_SEDES_DATA.find(s => s.id === id);
    if (!data) {
      const { left: leftFn } = await import('@gymsync/core');
      return leftFn(new Error(`Sede con id ${id} no encontrada`));
    }

    return right(
      Sede.create({
        id: Identifier.create(data.id),
        nombre: data.nombre,
        direccion: data.direccion,
        coordenadas: Coordenadas.create({
          latitude: data.latitude,
          longitude: data.longitude,
        }),
        aforo: Aforo.create({
          maximo: data.aforoMaximo,
          actual: data.aforoActual,
        }),
        horarios: HorariosSede.create(data.horarios),
        servicios: data.servicios,
        beneficios: data.beneficios,
        telefono: data.telefono,
      })
    );
  }
}
