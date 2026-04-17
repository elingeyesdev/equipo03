/**
 * Mock de ISedesApiService para tests.
 */

import { ISedesApiService, SedesQueryParams } from '../../src/modules/geolocation/application/ports/output/ISedesApiService.port';
import { Either, left, right } from '../../src/shared/kernel/Either';
import { Sede } from '../../src/modules/geolocation/domain/entities/Sede.entity';
import { Coordenadas } from '../../src/modules/geolocation/domain/value-objects/Coordenadas.vo';
import { Aforo } from '../../src/modules/geolocation/domain/value-objects/Aforo.vo';
import { Identifier } from '../../src/shared/kernel/Identifier';

type MockSedeData = {
  id: string;
  nombre: string;
  latitude: number;
  longitude: number;
  aforoMaximo?: number;
  aforoActual?: number;
};

export class MockSedesApiService implements ISedesApiService {
  private mockSedes: Sede[] = [];
  private mockError: Error | null = null;

  setSedesMock(data: MockSedeData[]): void {
    this.mockSedes = data.map(d => Sede.create({
      id: Identifier.create(d.id),
      nombre: d.nombre,
      direccion: `Dirección de ${d.nombre}`,
      coordenadas: Coordenadas.create({
        latitude: d.latitude,
        longitude: d.longitude,
      }),
      aforo: Aforo.create({
        maximo: d.aforoMaximo ?? 100,
        actual: d.aforoActual ?? 50,
      }),
      servicios: ['Musculación'],
    }));
    this.mockError = null;
  }

  setErrorMock(error: Error): void {
    this.mockError = error;
    this.mockSedes = [];
  }

  async obtenerSedes(_params: SedesQueryParams): Promise<Either<Error, Sede[]>> {
    if (this.mockError) {
      return left(this.mockError);
    }
    return right(this.mockSedes);
  }

  async obtenerSedePorId(id: string): Promise<Either<Error, Sede>> {
    const sede = this.mockSedes.find(s => s.id.value === id);
    if (!sede) {
      return left(new Error(`Sede ${id} no encontrada`));
    }
    return right(sede);
  }
}
