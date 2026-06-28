import { ISedesApiService, SedesQueryParams } from '@gymsync/core';
import { Either, right } from '@gymsync/core';
import { Sede } from '@gymsync/core';
import { Coordenadas } from '@gymsync/core';
import { Aforo } from '@gymsync/core';
import { HorariosSede, HorariosMap } from '@gymsync/core';
import { ServicioSede, BeneficioSede } from '@gymsync/core';
import { Identifier } from '@gymsync/core';

// 10 Sedes reales de gimnasios en Santa Cruz de la Sierra
const MOCK_SEDES_DATA = [
  {
    id: '1',
    nombre: 'Smart Fit Las Brisas',
    direccion: '4to Anillo y Av. Banzer, Las Brisas',
    latitude: -17.7554,
    longitude: -63.1662,
    aforoMaximo: 200,
    aforoActual: 156,
    horarios: { lunes: { apertura: '05:00', cierre: '23:00' }, domingo: { apertura: '07:00', cierre: '14:00' } } as HorariosMap,
    servicios: ['Musculación', 'Cardio', 'Clases'] as ServicioSede[],
    beneficios: ['Duchas', 'AC', 'Estacionamiento'] as BeneficioSede[],
    telefono: '+591 3 3456789',
    imagenUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1000&auto=format&fit=crop',
    rating: 4.8,
    resenasCount: 342,
  },
  {
    id: '2',
    nombre: 'Premier Fitness Club',
    direccion: 'Equipetrol, Calle Enrique Finot',
    latitude: -17.7634,
    longitude: -63.1962,
    aforoMaximo: 150,
    aforoActual: 60,
    horarios: { lunes: { apertura: '05:00', cierre: '23:00' }, domingo: { cerrado: true, apertura: '', cierre: '' } } as HorariosMap,
    servicios: ['Piscina', 'Crossfit', 'Squash'] as ServicioSede[],
    beneficios: ['Sauna', 'Cafetería', 'WiFi'] as BeneficioSede[],
    telefono: '+591 3 3345678',
    imagenUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop',
    rating: 4.9,
    resenasCount: 512,
  },
  {
    id: '3',
    nombre: 'Bio Fitness Busch',
    direccion: 'Av. Busch y 2do Anillo',
    latitude: -17.7756,
    longitude: -63.1887,
    aforoMaximo: 120,
    aforoActual: 80,
    horarios: { lunes: { apertura: '06:00', cierre: '22:00' }, domingo: { apertura: '08:00', cierre: '12:00' } } as HorariosMap,
    servicios: ['Yoga', 'Pilates', 'Zumba'] as ServicioSede[],
    beneficios: ['Nutricionista', 'Duchas'] as BeneficioSede[],
    telefono: '+591 3 3567890',
    imagenUrl: 'https://images.unsplash.com/photo-1564415315949-2182d398f6dd?q=80&w=1000&auto=format&fit=crop',
    rating: 4.5,
    resenasCount: 128,
  },
  {
    id: '4',
    nombre: 'Reyes Gym',
    direccion: 'Av. Melchor Pinto #355',
    latitude: -17.7812,
    longitude: -63.1711,
    aforoMaximo: 80,
    aforoActual: 75,
    horarios: { lunes: { apertura: '06:00', cierre: '21:00' }, domingo: { cerrado: true, apertura: '', cierre: '' } } as HorariosMap,
    servicios: ['Boxeo', 'Kickboxing', 'Pesas'] as ServicioSede[],
    beneficios: ['Vestidores', 'Ring oficial'] as BeneficioSede[],
    telefono: '+591 3 3234567',
    imagenUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop',
    rating: 4.7,
    resenasCount: 89,
  },
  {
    id: '5',
    nombre: 'Body Masters',
    direccion: 'Av. Argentina #150',
    latitude: -17.7942,
    longitude: -63.1666,
    aforoMaximo: 100,
    aforoActual: 45,
    horarios: { lunes: { apertura: '05:00', cierre: '22:00' }, domingo: { apertura: '08:00', cierre: '14:00' } } as HorariosMap,
    servicios: ['Crossfit', 'Funcional', 'Spinning'] as ServicioSede[],
    beneficios: ['Área Outdoor', 'WiFi'] as BeneficioSede[],
    telefono: '+591 3 3986701',
    imagenUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1000&auto=format&fit=crop',
    rating: 4.6,
    resenasCount: 201,
  },
  {
    id: '6',
    nombre: 'Smart Fit IC Norte',
    direccion: 'Av. Busching y 3er Anillo',
    latitude: -17.7818,
    longitude: -63.1706,
    aforoMaximo: 220,
    aforoActual: 105,
    horarios: { lunes: { apertura: '05:00', cierre: '23:00' }, domingo: { apertura: '08:00', cierre: '18:00' } } as HorariosMap,
    servicios: ['Cardio', 'Pesas libres', 'HIIT'] as ServicioSede[],
    beneficios: ['Lockers digitales', 'AC'] as BeneficioSede[],
    telefono: '+591 3 3556789',
    imagenUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1000&auto=format&fit=crop',
    rating: 4.8,
    resenasCount: 450,
  },
  {
    id: '7',
    nombre: 'Fitbull Gym',
    direccion: 'Calle Moldes y 2do Anillo',
    latitude: -17.7886,
    longitude: -63.1802,
    aforoMaximo: 90,
    aforoActual: 88,
    horarios: { lunes: { apertura: '06:00', cierre: '22:00' }, domingo: { cerrado: true, apertura: '', cierre: '' } } as HorariosMap,
    servicios: ['Culturismo', 'Powerlifting'] as ServicioSede[],
    beneficios: ['Suplementación', 'Parqueo'] as BeneficioSede[],
    telefono: '+591 3 3112233',
    imagenUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000&auto=format&fit=crop',
    rating: 4.9,
    resenasCount: 400,
  },
  {
    id: '8',
    nombre: 'Energym',
    direccion: 'Calle Velasco #540',
    latitude: -17.7844,
    longitude: -63.1818,
    aforoMaximo: 110,
    aforoActual: 20,
    horarios: { lunes: { apertura: '05:30', cierre: '21:30' }, domingo: { apertura: '09:00', cierre: '13:00' } } as HorariosMap,
    servicios: ['Aeróbicos', 'Musculación'] as ServicioSede[],
    beneficios: ['Clima controlado', 'Duchas'] as BeneficioSede[],
    telefono: '+591 3 3445566',
    imagenUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop',
    rating: 4.3,
    resenasCount: 56,
  },
  {
    id: '9',
    nombre: 'Elite Fitness',
    direccion: 'Av. Beni entre 4to y 5to',
    latitude: -17.7420,
    longitude: -63.1610,
    aforoMaximo: 130,
    aforoActual: 50,
    horarios: { lunes: { apertura: '06:00', cierre: '22:00' }, domingo: { cerrado: true, apertura: '', cierre: '' } } as HorariosMap,
    servicios: ['Funcional', 'TRX', 'Yoga'] as ServicioSede[],
    beneficios: ['Jugos naturales', 'AC'] as BeneficioSede[],
    telefono: '+591 3 3998877',
    imagenUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1000&auto=format&fit=crop',
    rating: 4.7,
    resenasCount: 180,
  },
  {
    id: '10',
    nombre: 'World Gym SCZ',
    direccion: 'Barrio Sirari, Calle Los Claveles',
    latitude: -17.7550,
    longitude: -63.1850,
    aforoMaximo: 300,
    aforoActual: 120,
    horarios: { lunes: { apertura: '05:00', cierre: '24:00' }, domingo: { apertura: '06:00', cierre: '20:00' } } as HorariosMap,
    servicios: ['Musculación', 'Cardio', 'HIIT'] as ServicioSede[],
    beneficios: ['App propia', 'Estacionamiento'] as BeneficioSede[],
    telefono: '+591 3 3550011',
    imagenUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1000&auto=format&fit=crop',
    rating: 4.9,
    resenasCount: 950,
  },
];

export class MockSedesApiAdapter implements ISedesApiService {
  private readonly SIMULATED_DELAY_MS = 800;

  async obtenerSedes(_params: SedesQueryParams): Promise<Either<Error, Sede[]>> {
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
        imagenUrl: data.imagenUrl,
        rating: data.rating,
        resenasCount: data.resenasCount,
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
        imagenUrl: data.imagenUrl,
        rating: data.rating,
        resenasCount: data.resenasCount,
      })
    );
  }
}
