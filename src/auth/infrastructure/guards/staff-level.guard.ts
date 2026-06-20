import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class StaffLevelGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user && user.level >= 3) {
      return true;
    }

    throw new ForbiddenException('Se requiere nivel de staff (entrenador o superior).');
  }
}
