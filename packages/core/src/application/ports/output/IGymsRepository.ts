export interface IGymsRepository {
  findById(id: number): Promise<{ id: number; name: string } | null>;
}

export const IGymsRepository = Symbol('IGymsRepository');
