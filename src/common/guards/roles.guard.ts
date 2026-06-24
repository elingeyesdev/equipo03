import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/** Nivel mínimo requerido por etiqueta de rol (valores reales de la columna hierarchy_level). */
const ROLE_LEVEL_MAP: Record<string, number> = {
  SUPER_ADMIN:          10,
  GERENTE:               5,
  RECEPCIONISTA:         4,
  ENTRENADOR:            3,
  NUTRICIONISTA:         3,
  INSTRUCTOR:            2,
  COORDINADOR:           2,
  USER:                  1,
  CLIENTE:               1,
  PERSONAL_DE_LIMPIEZA:  1,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;

    const { user } = context.switchToHttp().getRequest();
    const userLevel = user?.level ?? 0;

    // Nivel mínimo entre los roles requeridos (semántica OR: basta cumplir el menos exigente)
    const minRequired = Math.min(
      ...required.map(r => ROLE_LEVEL_MAP[r.toUpperCase()] ?? Infinity),
    );

    if (userLevel >= minRequired) return true;

    throw new ForbiddenException('No tiene permisos para realizar esta acción');
  }
}
