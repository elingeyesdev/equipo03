export interface IUserRolesRepository {
  findManagerByGymId(gymId: number): Promise<number | null>;
}

export const IUserRolesRepository = Symbol('IUserRolesRepository');
