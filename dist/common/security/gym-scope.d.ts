import { Request } from 'express';
export type RequestUser = {
    userId: string | number;
    email: string;
    role?: string | null;
    gymId?: number | null;
};
export type RequestWithUser = Request & {
    user?: RequestUser;
};
export declare function getManagerGymId(req: RequestWithUser): number | null;
export declare function ensureManagerMatchesResourceGym(managerGymId: number | null, resourceGymId: number | null | undefined): void;
