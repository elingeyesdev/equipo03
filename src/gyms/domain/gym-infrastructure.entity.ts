import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Gym } from './gym.entity';

@Entity('gym_infrastructure')
export class GymInfrastructure {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer', name: 'gym_id', unique: true })
  gymId!: number;

  @Column({ type: 'integer', name: 'machine_capacity', default: 0 })
  machineCapacity!: number;

  // @Column({ type: 'integer', name: 'lockers_count', nullable: true })
  // lockersCount: number;

  // @Column({ type: 'integer', name: 'sqm', nullable: true })
  // sqm: number;

  @OneToOne(() => Gym, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gym_id' })
  gym!: Gym;
}
