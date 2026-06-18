import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

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
    const userRole = user?.role?.toUpperCase() ?? '';
    const userLevel = user?.level ?? 0;

    const requiredUpper = required.map(r => r.toUpperCase());

    if (requiredUpper.includes(userRole)) return true;

    if (requiredUpper.includes('SUPER_ADMIN') && userLevel >= 10) return true;
    if (requiredUpper.includes('GERENTE') && userLevel >= 4) return true;
    if (requiredUpper.includes('RECEPCIONISTA') && userLevel >= 4) return true;
    if (requiredUpper.includes('ENTRENADOR') && userLevel >= 3) return true;
    if (requiredUpper.includes('INSTRUCTOR') && userLevel >= 3) return true;
    if (requiredUpper.includes('NUTRICIONISTA') && userLevel >= 3) return true;
    if ((requiredUpper.includes('USER') || requiredUpper.includes('CLIENTE')) && userLevel >= 1) return true;

    throw new ForbiddenException(
      'No tiene permisos para realizar esta acción',
    );
  }
}
