/**
 * Tests unitarios para Aforo Value Object.
 */

import { Aforo } from '../../../../../src/modules/geolocation/domain/value-objects/Aforo.vo';

describe('Aforo Value Object', () => {
  
  describe('create()', () => {
    it('debe crear aforo válido', () => {
      const aforo = Aforo.create({ maximo: 100, actual: 50 });
      expect(aforo.maximo).toBe(100);
      expect(aforo.actual).toBe(50);
    });

    it('debe lanzar error si máximo es 0', () => {
      expect(() => Aforo.create({ maximo: 0, actual: 0 }))
        .toThrow('El aforo máximo debe ser mayor a 0');
    });

    it('debe lanzar error si máximo es negativo', () => {
      expect(() => Aforo.create({ maximo: -10, actual: 0 }))
        .toThrow('El aforo máximo debe ser mayor a 0');
    });

    it('debe lanzar error si actual es negativo', () => {
      expect(() => Aforo.create({ maximo: 100, actual: -5 }))
        .toThrow('El aforo actual no puede ser negativo');
    });

    it('debe lanzar error si actual supera máximo', () => {
      expect(() => Aforo.create({ maximo: 100, actual: 110 }))
        .toThrow('El aforo actual no puede superar el máximo');
    });
  });

  describe('cuposDisponibles', () => {
    it('debe calcular cupos disponibles', () => {
      const aforo = Aforo.create({ maximo: 100, actual: 60 });
      expect(aforo.cuposDisponibles).toBe(40);
    });

    it('debe ser 0 cuando está lleno', () => {
      const aforo = Aforo.create({ maximo: 100, actual: 100 });
      expect(aforo.cuposDisponibles).toBe(0);
    });
  });

  describe('hayCuposDisponibles', () => {
    it('debe ser true cuando hay cupos', () => {
      const aforo = Aforo.create({ maximo: 100, actual: 50 });
      expect(aforo.hayCuposDisponibles).toBe(true);
    });

    it('debe ser false cuando está lleno', () => {
      const aforo = Aforo.create({ maximo: 100, actual: 100 });
      expect(aforo.hayCuposDisponibles).toBe(false);
    });
  });

  describe('porcentajeOcupacion', () => {
    it('debe calcular porcentaje correctamente', () => {
      const aforo = Aforo.create({ maximo: 100, actual: 75 });
      expect(aforo.porcentajeOcupacion).toBe(75);
    });

    it('debe ser 0 cuando está vacío', () => {
      const aforo = Aforo.create({ maximo: 100, actual: 0 });
      expect(aforo.porcentajeOcupacion).toBe(0);
    });

    it('debe ser 100 cuando está lleno', () => {
      const aforo = Aforo.create({ maximo: 100, actual: 100 });
      expect(aforo.porcentajeOcupacion).toBe(100);
    });

    it('debe redondear correctamente', () => {
      const aforo = Aforo.create({ maximo: 3, actual: 1 });
      expect(aforo.porcentajeOcupacion).toBe(33); // 33.33... → 33
    });
  });

  describe('nivelOcupacion', () => {
    it('debe ser "bajo" cuando < 60%', () => {
      const aforo = Aforo.create({ maximo: 100, actual: 30 });
      expect(aforo.nivelOcupacion).toBe('bajo');
    });

    it('debe ser "bajo" cuando es 59%', () => {
      const aforo = Aforo.create({ maximo: 100, actual: 59 });
      expect(aforo.nivelOcupacion).toBe('bajo');
    });

    it('debe ser "medio" cuando es 60%', () => {
      const aforo = Aforo.create({ maximo: 100, actual: 60 });
      expect(aforo.nivelOcupacion).toBe('medio');
    });

    it('debe ser "medio" cuando es 85%', () => {
      const aforo = Aforo.create({ maximo: 100, actual: 85 });
      expect(aforo.nivelOcupacion).toBe('medio');
    });

    it('debe ser "alto" cuando > 85%', () => {
      const aforo = Aforo.create({ maximo: 100, actual: 90 });
      expect(aforo.nivelOcupacion).toBe('alto');
    });

    it('debe ser "alto" cuando está lleno', () => {
      const aforo = Aforo.create({ maximo: 100, actual: 100 });
      expect(aforo.nivelOcupacion).toBe('alto');
    });
  });

  describe('textoFormateado', () => {
    it('debe formatear como "actual/maximo"', () => {
      const aforo = Aforo.create({ maximo: 100, actual: 45 });
      expect(aforo.textoFormateado).toBe('45/100');
    });
  });

  describe('equals', () => {
    it('debe ser igual a otro aforo con mismos valores', () => {
      const a = Aforo.create({ maximo: 100, actual: 50 });
      const b = Aforo.create({ maximo: 100, actual: 50 });
      expect(a.equals(b)).toBe(true);
    });

    it('no debe ser igual a otro aforo con valores diferentes', () => {
      const a = Aforo.create({ maximo: 100, actual: 50 });
      const b = Aforo.create({ maximo: 100, actual: 60 });
      expect(a.equals(b)).toBe(false);
    });
  });
});
