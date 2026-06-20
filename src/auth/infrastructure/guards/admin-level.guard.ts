import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminLevelGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // Validar jerarquía administrativa (>= 4): SuperAdmin, Gerente, Recepcionista
    if (user && user.level >= 4) {
      return true;
    }
    
    throw new ForbiddenException('No tienes el nivel jerárquico suficiente para modificar el catálogo.');
  }
}
