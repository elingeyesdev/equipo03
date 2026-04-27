import type { IAccessApiService, AccesoQueryParams } from '../output/IAccessApiService.port';
import type { Acceso } from '../../../domain/entities/Acceso.entity';
import { Either, left } from '../../../shared/kernel/Either';

export type UserRole = 'SUPER_ADMIN' | 'GERENTE' | 'USER';

export interface AutenticacionContext {
  userId: string;
  role: UserRole;
  gymId?: string; // Requerido si es GERENTE (vinculado en user_roles)
}

export class ConsultarHistorialAccesosUseCase {
  constructor(private readonly accessApiService: IAccessApiService) {}

  async execute(
    authContext: AutenticacionContext,
    params: AccesoQueryParams
  ): Promise<Either<Error, { data: Acceso[], total: number }>> {
    
    // RBAC: Verificación de permisos según la tabla roles y user_roles
    let gymIdFilter = params.gymId;

    if (authContext.role === 'GERENTE') {
      if (!authContext.gymId) {
        return left(new Error('ACCESO_DENEGADO: El gerente no tiene un gym_id asignado en user_roles.'));
      }
      // Un gerente SOLO puede ver su propia sede, forzamos el filtro.
      gymIdFilter = authContext.gymId;
    } else if (authContext.role !== 'SUPER_ADMIN') {
      return left(new Error('ACCESO_DENEGADO: Rol no autorizado para visualizar auditoría.'));
    }

    const secureParams: AccesoQueryParams = {
      ...params,
      gymId: gymIdFilter
    };

    return await this.accessApiService.obtenerHistorialAccesos(secureParams);
  }
}
