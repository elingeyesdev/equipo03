import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class StaffLevelGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user && user.level >= 2) {
      return true;
    }

    throw new ForbiddenException('Se requiere nivel de staff (instructor o superior).');
  }
}
