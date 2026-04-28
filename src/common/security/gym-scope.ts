import { ForbiddenException } from '@nestjs/common';
import { Request } from 'express';

export type RequestUser = {
  userId: string | number;
  email: string;
  role?: string | null;
  gymId?: number | null;
};

export type RequestWithUser = Request & { user?: RequestUser };

/** Cuando el rol es GERENTE devuelve su gymId; SUPER_ADMIN u otros roles sin sede → null (sin filtro). */
export function getManagerGymId(req: RequestWithUser): number | null {
  const user = req.user;
  if (!user || user.role !== 'GERENTE') return null;
  if (user.gymId === null || user.gymId === undefined) {
    throw new ForbiddenException('El gerente no tiene un gimnasio asignado');
  }
  return Number(user.gymId);
}

export function ensureManagerMatchesResourceGym(managerGymId: number | null, resourceGymId: number | null | undefined): void {
  if (managerGymId === null) return;
  if (resourceGymId === null || resourceGymId === undefined) {
    throw new ForbiddenException('No tiene permisos para acceder a este recurso');
  }
  if (Number(resourceGymId) !== managerGymId) {
    throw new ForbiddenException('No tiene permisos para acceder a otra sucursal');
  }
}
