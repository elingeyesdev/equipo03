/**
 * Tests unitarios para Distancia Value Object.
 */

import { Distancia } from '../../../../../src/modules/geolocation/domain/value-objects/Distancia.vo';

describe('Distancia Value Object', () => {
  
  describe('create()', () => {
    it('debe crear distancia válida en metros', () => {
      const dist = Distancia.create(1500);
      expect(dist.metros).toBe(1500);
    });

    it('debe lanzar error con distancia negativa', () => {
      expect(() => Distancia.create(-100))
        .toThrow('La distancia no puede ser negativa');
    });

    it('debe aceptar distancia 0', () => {
      const dist = Distancia.create(0);
      expect(dist.metros).toBe(0);
    });
  });

  describe('km', () => {
    it('debe convertir metros a kilómetros', () => {
      const dist = Distancia.create(2500);
      expect(dist.km).toBe(2.5);
    });

    it('debe retornar 0 km para 0 metros', () => {
      const dist = Distancia.create(0);
      expect(dist.km).toBe(0);
    });
  });

  describe('kmFija', () => {
    it('debe formatear con 1 decimal', () => {
      const dist = Distancia.create(2345);
      expect(dist.kmFija).toBe('2.3');
    });

    it('debe redondear correctamente', () => {
      const dist = Distancia.create(2850);
      expect(dist.kmFija).toBe('2.9');
    });
  });

  describe('kmCorta', () => {
    it('debe mostrar metros para distancias < 1km', () => {
      const dist = Distancia.create(500);
      expect(dist.kmCorta).toBe('500m');
    });

    it('debe mostrar km para distancias >= 1km', () => {
      const dist = Distancia.create(2300);
      expect(dist.kmCorta).toBe('2.3km');
    });

    it('debe redondear metros a entero', () => {
      const dist = Distancia.create(456.7);
      expect(dist.kmCorta).toBe('457m');
    });
  });

  describe('legible', () => {
    it('debe retornar "metros" para distancias cortas', () => {
      const dist = Distancia.create(750);
      expect(dist.legible).toBe('750 metros');
    });

    it('debe retornar "kilómetros" para distancias largas', () => {
      const dist = Distancia.create(3200);
      expect(dist.legible).toBe('3.2 kilómetros');
    });
  });

  describe('comparaciones', () => {
    it('esMenorQue debe funcionar correctamente', () => {
      const corta = Distancia.create(100);
      const larga = Distancia.create(500);
      expect(corta.esMenorQue(larga)).toBe(true);
      expect(larga.esMenorQue(corta)).toBe(false);
    });

    it('esMayorQue debe funcionar correctamente', () => {
      const corta = Distancia.create(100);
      const larga = Distancia.create(500);
      expect(larga.esMayorQue(corta)).toBe(true);
      expect(corta.esMayorQue(larga)).toBe(false);
    });

    it('equals debe funcionar correctamente', () => {
      const a = Distancia.create(100);
      const b = Distancia.create(100);
      const c = Distancia.create(200);
      expect(a.equals(b)).toBe(true);
      expect(a.equals(c)).toBe(false);
    });
  });
});
