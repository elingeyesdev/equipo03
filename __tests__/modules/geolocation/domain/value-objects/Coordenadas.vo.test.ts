/**
 * Tests unitarios para Coordenadas Value Object.
 */

import { Coordenadas } from '../../../../../src/modules/geolocation/domain/value-objects/Coordenadas.vo';

describe('Coordenadas Value Object', () => {
  
  describe('create()', () => {
    it('debe crear coordenadas válidas', () => {
      const coords = Coordenadas.create({ latitude: -17.783, longitude: -63.182 });
      expect(coords.latitude).toBe(-17.783);
      expect(coords.longitude).toBe(-63.182);
    });

    it('debe crear coordenadas con accuracy', () => {
      const coords = Coordenadas.create({
        latitude: -17.783,
        longitude: -63.182,
        accuracy: 10,
      });
      expect(coords.accuracy).toBe(10);
    });

    it('debe asignar timestamp automáticamente', () => {
      const coords = Coordenadas.create({ latitude: 0, longitude: 0 });
      expect(coords.timestamp).toBeInstanceOf(Date);
    });

    it('debe lanzar error con latitude > 90', () => {
      expect(() => Coordenadas.create({ latitude: 100, longitude: 0 }))
        .toThrow('Latitude fuera de rango');
    });

    it('debe lanzar error con latitude < -90', () => {
      expect(() => Coordenadas.create({ latitude: -91, longitude: 0 }))
        .toThrow('Latitude fuera de rango');
    });

    it('debe lanzar error con longitude > 180', () => {
      expect(() => Coordenadas.create({ latitude: 0, longitude: 200 }))
        .toThrow('Longitude fuera de rango');
    });

    it('debe lanzar error con longitude < -180', () => {
      expect(() => Coordenadas.create({ latitude: 0, longitude: -181 }))
        .toThrow('Longitude fuera de rango');
    });

    it('debe aceptar valores límite válidos', () => {
      // Extremos válidos
      expect(() => Coordenadas.create({ latitude: 90, longitude: 180 })).not.toThrow();
      expect(() => Coordenadas.create({ latitude: -90, longitude: -180 })).not.toThrow();
    });

    it('debe lanzar error con accuracy negativa', () => {
      expect(() => Coordenadas.create({ latitude: 0, longitude: 0, accuracy: -5 }))
        .toThrow('Accuracy no puede ser negativa');
    });
  });

  describe('toGeolibFormat()', () => {
    it('debe retornar formato compatible con geolib', () => {
      const coords = Coordenadas.create({ latitude: -17.783, longitude: -63.182 });
      expect(coords.toGeolibFormat()).toEqual({
        latitude: -17.783,
        longitude: -63.182,
      });
    });
  });

  describe('toMapCoordinate()', () => {
    it('debe retornar formato compatible con react-native-maps', () => {
      const coords = Coordenadas.create({ latitude: -17.783, longitude: -63.182 });
      expect(coords.toMapCoordinate()).toEqual({
        latitude: -17.783,
        longitude: -63.182,
      });
    });
  });

  describe('equals()', () => {
    it('debe ser igual a coordenadas con mismos valores', () => {
      const a = Coordenadas.create({ latitude: -17.783, longitude: -63.182 });
      const b = Coordenadas.create({ latitude: -17.783, longitude: -63.182 });
      expect(a.equals(b)).toBe(true);
    });

    it('no debe ser igual a coordenadas diferentes', () => {
      const a = Coordenadas.create({ latitude: -17.783, longitude: -63.182 });
      const b = Coordenadas.create({ latitude: -17.800, longitude: -63.200 });
      expect(a.equals(b)).toBe(false);
    });
  });

  describe('toString()', () => {
    it('debe formatear coordenadas como string legible', () => {
      const coords = Coordenadas.create({ latitude: -17.783, longitude: -63.182 });
      expect(coords.toString()).toBe('(-17.783000, -63.182000)');
    });
  });
});
