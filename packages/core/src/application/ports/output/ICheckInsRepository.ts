import { CheckIn } from '../../../domain/entities/CheckIn.entity';

export interface ICheckInsRepository {
  save(checkIn: CheckIn): Promise<CheckIn>;
}

export const ICheckInsRepository = Symbol('ICheckInsRepository');
