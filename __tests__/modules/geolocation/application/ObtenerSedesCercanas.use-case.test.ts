/**
 * Tests de integración para ObtenerSedesCercanasUseCase.
 * 
 * Usa mocks de los servicios externos (geolocation, API)
 * para verificar la orquestación del caso de uso.
 */

import { ObtenerSedesCercanasUseCase } from '../../../../src/modules/geolocation/application/ports/input/ObtenerSedesCercanas.use-case';
import { MockGeolocationService } from '../../../__mocks__/MockGeolocationService';
import { MockSedesApiService } from '../../../__mocks__/MockSedesApiService';
import { UbicacionNoDisponibleError } from '../../../../src/modules/geolocation/domain/errors/UbicacionNoDisponible.error';

describe('ObtenerSedesCercanasUseCase', () => {
  let useCase: ObtenerSedesCercanasUseCase;
  let mockGeo: MockGeolocationService;
  let mockApi: MockSedesApiService;

  beforeEach(() => {
    mockGeo = new MockGeolocationService();
    mockApi = new MockSedesApiService();
    useCase = new ObtenerSedesCercanasUseCase(mockGeo, mockApi);
  });

  describe('Escenario exitoso', () => {
    it('debe retornar sedes ordenadas por distancia', async () => {
      // Arrange: usuario en el centro de Santa Cruz
      mockGeo.setUbicacionMock({ latitude: -17.783, longitude: -63.182 });
      mockApi.setSedesMock([
        { id: '1', nombre: 'Sede Lejana', latitude: -17.9, longitude: -63.3 },
        { id: '2', nombre: 'Sede Cercana', latitude: -17.79, longitude: -63.19 },
      ]);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const sedes = result.value;
        expect(sedes).toHaveLength(2);
        expect(sedes[0].sede.nombre).toBe('Sede Cercana');
        expect(sedes[1].sede.nombre).toBe('Sede Lejana');
        expect(sedes[0].distancia.metros).toBeLessThan(sedes[1].distancia.metros);
      }
    });

    it('debe respetar maxResultados', async () => {
      mockGeo.setUbicacionMock({ latitude: -17.783, longitude: -63.182 });
      mockApi.setSedesMock([
        { id: '1', nombre: 'Sede A', latitude: -17.79, longitude: -63.19 },
        { id: '2', nombre: 'Sede B', latitude: -17.80, longitude: -63.20 },
        { id: '3', nombre: 'Sede C', latitude: -17.81, longitude: -63.21 },
      ]);

      const result = await useCase.execute({ maxResultados: 2 });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value).toHaveLength(2);
      }
    });

    it('debe incluir distancias calculadas en metros', async () => {
      mockGeo.setUbicacionMock({ latitude: -17.783, longitude: -63.182 });
      mockApi.setSedesMock([
        { id: '1', nombre: 'Sede Test', latitude: -17.79, longitude: -63.19 },
      ]);

      const result = await useCase.execute();

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value[0].distancia.metros).toBeGreaterThan(0);
        expect(result.value[0].distancia.km).toBeGreaterThan(0);
      }
    });

    it('debe manejar lista vacía de sedes', async () => {
      mockGeo.setUbicacionMock({ latitude: -17.783, longitude: -63.182 });
      mockApi.setSedesMock([]);

      const result = await useCase.execute();

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value).toHaveLength(0);
      }
    });
  });

  describe('Escenario de error', () => {
    it('debe retornar error si la ubicación no está disponible', async () => {
      mockGeo.setErrorMock(
        new UbicacionNoDisponibleError('GPS apagado', undefined, 'GPS_DESACTIVADO')
      );

      const result = await useCase.execute();

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(UbicacionNoDisponibleError);
      }
    });

    it('debe retornar error si el permiso es denegado', async () => {
      mockGeo.setPermisoDenegado();

      const result = await useCase.execute();

      expect(result.isLeft()).toBe(true);
    });

    it('debe retornar error si la API falla', async () => {
      mockGeo.setUbicacionMock({ latitude: -17.783, longitude: -63.182 });
      mockApi.setErrorMock(new Error('Network Error'));

      const result = await useCase.execute();

      expect(result.isLeft()).toBe(true);
    });
  });

  describe('executeConCoordenadas', () => {
    it('debe funcionar con coordenadas manuales sin necesitar geolocation', async () => {
      const { Coordenadas } = await import(
        '../../../../src/modules/geolocation/domain/value-objects/Coordenadas.vo'
      );
      
      mockApi.setSedesMock([
        { id: '1', nombre: 'Sede Manual', latitude: -17.79, longitude: -63.19 },
      ]);

      const coordenadas = Coordenadas.create({ latitude: -17.783, longitude: -63.182 });
      const result = await useCase.executeConCoordenadas(coordenadas);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value[0].sede.nombre).toBe('Sede Manual');
      }
    });
  });
});
