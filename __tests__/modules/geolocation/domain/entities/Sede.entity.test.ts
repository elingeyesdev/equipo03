/**
 * Tests unitarios para Sede Entity.
 */

import { Sede } from '../../../../../src/modules/geolocation/domain/entities/Sede.entity';
import { Coordenadas } from '../../../../../src/modules/geolocation/domain/value-objects/Coordenadas.vo';
import { Aforo } from '../../../../../src/modules/geolocation/domain/value-objects/Aforo.vo';
import { HorariosSede } from '../../../../../src/modules/geolocation/domain/value-objects/HorariosSede.vo';
import { ServicioSede } from '../../../../../src/modules/geolocation/domain/entities/Sede.entity';
import { Identifier } from '../../../../../src/shared/kernel/Identifier';

const crearSedeValida = (overrides?: Partial<{
  id: string;
  nombre: string;
  aforoActual: number;
  aforoMaximo: number;
  servicios: ServicioSede[];
}>) => Sede.create({
  id: Identifier.create(overrides?.id ?? '1'),
  nombre: overrides?.nombre ?? 'GymSync Test',
  direccion: 'Av. Test #123, Santa Cruz',
  coordenadas: Coordenadas.create({ latitude: -17.783, longitude: -63.182 }),
  aforo: Aforo.create({
    maximo: overrides?.aforoMaximo ?? 100,
    actual: overrides?.aforoActual ?? 50,
  }),
  servicios: overrides?.servicios ?? ['Musculación', 'Yoga'],
  horarios: HorariosSede.create({ lunes: { apertura: '06:00', cierre: '22:00' } }),
  telefono: '+591 3 1234567',
});

describe('Sede Entity', () => {
  
  describe('create()', () => {
    it('debe crear sede válida', () => {
      const sede = crearSedeValida();
      expect(sede.nombre).toBe('GymSync Test');
      expect(sede.direccion).toBe('Av. Test #123, Santa Cruz');
    });

    it('debe lanzar error con nombre vacío', () => {
      expect(() => crearSedeValida({ nombre: '' }))
        .toThrow('El nombre de la sede no puede estar vacío');
    });

    it('debe lanzar error con nombre de solo espacios', () => {
      expect(() => crearSedeValida({ nombre: '   ' }))
        .toThrow('El nombre de la sede no puede estar vacío');
    });
  });

  describe('estaDisponible', () => {
    it('debe ser true cuando hay cupos', () => {
      const sede = crearSedeValida({ aforoActual: 50, aforoMaximo: 100 });
      expect(sede.estaDisponible).toBe(true);
    });

    it('debe ser false cuando está lleno', () => {
      const sede = crearSedeValida({ aforoActual: 100, aforoMaximo: 100 });
      expect(sede.estaDisponible).toBe(false);
    });
  });

  describe('tieneServicio()', () => {
    it('debe encontrar un servicio existente', () => {
      const sede = crearSedeValida({ servicios: ['Musculación', 'Yoga'] });
      expect(sede.tieneServicio('Yoga')).toBe(true);
    });

    it('debe tener match estricto para servicios', () => {
      const sede = crearSedeValida({ servicios: ['Musculación'] });
      expect(sede.tieneServicio('Musculación')).toBe(true);
    });

    it('debe retornar false para servicio inexistente', () => {
      const sede = crearSedeValida({ servicios: ['Musculación'] });
      expect(sede.tieneServicio('Natación')).toBe(false);
    });
  });

  describe('toDTO()', () => {
    it('debe convertir a DTO plano correctamente', () => {
      const sede = crearSedeValida();
      const dto = sede.toDTO();

      expect(dto.id).toBe('1');
      expect(dto.nombre).toBe('GymSync Test');
      expect(dto.latitude).toBe(-17.783);
      expect(dto.longitude).toBe(-63.182);
      expect(dto.aforoMaximo).toBe(100);
      expect(dto.aforoActual).toBe(50);
      expect(dto.servicios).toEqual(['Musculación', 'Yoga']);
      expect(dto.telefono).toBe('+591 3 1234567');
    });
  });

  describe('coordenadas', () => {
    it('debe retornar las coordenadas de la sede', () => {
      const sede = crearSedeValida();
      expect(sede.coordenadas.latitude).toBe(-17.783);
      expect(sede.coordenadas.longitude).toBe(-63.182);
    });
  });

  describe('id', () => {
    it('debe retornar el identificador', () => {
      const sede = crearSedeValida({ id: '42' });
      expect(sede.id.value).toBe('42');
    });
  });
});
