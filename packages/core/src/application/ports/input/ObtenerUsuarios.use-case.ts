import type { AutenticacionContext } from './ConsultarHistorialAccesos.use-case';
import type { IUsersApiService, IUserRecord } from '../output/IUsersApiService';
import { Either, right, left } from '../../../shared/kernel/Either';

/**
 * ObtenerUsuariosUseCase — Caso de uso de obtención de usuarios con scope RBAC.
 *
 * Centraliza la regla de negocio: "Un GERENTE solo puede ver los usuarios
 * vinculados a su gymId". Esta decisión vive en el Core y no en ninguna UI.
 *
 * Patrón idéntico a ConsultarHistorialAccesosUseCase.
 * Cada plataforma (web, mobile) provee su implementación de IUsersApiService.
 */
export class ObtenerUsuariosUseCase {
  constructor(private readonly usersApiService: IUsersApiService) {}

  async execute(
    authContext: AutenticacionContext
  ): Promise<Either<Error, IUserRecord[]>> {

    // ── Verificación de permisos ──────────────────────────────────────────────
    const rolesPermitidos: AutenticacionContext['role'][] = [
      'SUPER_ADMIN', 'GERENTE', 'ENTRENADOR', 'NUTRICIONISTA',
    ];
    if (!rolesPermitidos.includes(authContext.role)) {
      return left(new Error('ACCESO_DENEGADO: Rol no autorizado para visualizar usuarios.'));
    }

    if (authContext.role === 'GERENTE' && !authContext.gymId) {
      return left(new Error('ACCESO_DENEGADO: El gerente no tiene un gymId asignado en user_roles.'));
    }

    // ── Obtención de datos (sin filtros en la llamada — el backend no los acepta) ──
    const allUsers = await this.usersApiService.findAll();

    // ── Aplicación de Scope RBAC (regla de negocio en el Core) ───────────────
    if (authContext.role === 'GERENTE' && authContext.gymId) {
      const scopeGymId = Number(authContext.gymId);
      const scoped = allUsers.filter(u =>
        Array.isArray(u.userRoles) &&
        u.userRoles.some(ur => Number(ur.gymId) === scopeGymId)
      );
      return right(scoped);
    }

    // SUPER_ADMIN, ENTRENADOR, NUTRICIONISTA — ven todos los usuarios
    return right(allUsers);
  }
}
