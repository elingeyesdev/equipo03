import { Either } from '../../../shared/kernel/Either';
import { Acceso } from '../../../domain/entities/Acceso.entity';

export interface AccesoQueryParams {
  gymId?: string;
  estado?: string;
  page?: number;
  limit?: number;
}

export interface IAccessApiService {
  obtenerHistorialAccesos(params: AccesoQueryParams): Promise<Either<Error, { data: Acceso[], total: number }>>;
}
