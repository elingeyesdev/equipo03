import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, OneToMany,
} from 'typeorm';
import { GymLocation } from './gym-location.entity';
import { GymSchedule } from './gym-schedule.entity';
import { GymActivity } from '../../activities/domain/gym-activity.entity';

@Entity('gyms')
export class Gym {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'integer', name: 'max_capacity' })
  maxCapacity: number;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', name: 'is_open', default: true })
  isOpen: boolean;

  @Column({ type: 'integer', name: 'parent_id', nullable: true })
  parentId: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamp', name: 'updated_at', nullable: true })
  updatedAt: Date;

  // ── Relations ─────────────────────────────────────
  @OneToOne(() => GymLocation, (loc) => loc.gym, { cascade: true })
  location: GymLocation;

  @OneToMany(() => GymSchedule, (s) => s.gym, { cascade: true })
  schedules: GymSchedule[];

  @OneToMany(() => GymActivity, (a) => a.gym)
  activities: GymActivity[];
}
