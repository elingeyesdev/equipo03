import type { IAccessApiService, AccesoQueryParams } from '../output/IAccessApiService.port';
import type { Acceso } from '../../../domain/entities/Acceso.entity';
import { Either, left } from '../../../shared/kernel/Either';

export type UserRole = 'SUPER_ADMIN' | 'GERENTE' | 'ENTRENADOR' | 'NUTRICIONISTA' | 'CLIENTE' | 'RECEPCIONISTA' | string;

export interface AutenticacionContext {
  userId: string;
  role: UserRole;
  gymId?: string;
  brandId?: string;
  level?: number;
  roleId?: number;
}

export class ConsultarHistorialAccesosUseCase {
  constructor(private readonly accessApiService: IAccessApiService) {}

  async execute(
    authContext: AutenticacionContext,
    params: AccesoQueryParams
  ): Promise<Either<Error, { data: Acceso[], total: number }>> {

    const level = authContext.level ?? 0;
    let gymIdFilter = params.gymId;

    if (level >= 10) {
      // SUPER_ADMIN: sin filtro, ve todo
    } else if (level >= 4) {
      // Gerente / Recepcionista: filtrar por su gym o brand
      const resolvedGymId = authContext.gymId || authContext.brandId;
      if (!resolvedGymId) {
        return left(new Error('ACCESO_DENEGADO: No tienes una sucursal o marca asignada.'));
      }
      gymIdFilter = resolvedGymId;
    } else {
      return left(new Error('ACCESO_DENEGADO: Rol no autorizado para visualizar auditoría.'));
    }

    const secureParams: AccesoQueryParams = {
      ...params,
      gymId: gymIdFilter
    };

    return await this.accessApiService.obtenerHistorialAccesos(secureParams);
  }
}
