import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { Gym } from '../../gyms/domain/gym.entity';
import { GymActivitySchedule } from './gym-activity-schedule.entity';

@Entity('gym_activity')
export class GymActivity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', name: 'gym_id' })
  gymId: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'integer', name: 'default_duration_min', nullable: true })
  defaultDurationMin: number;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  // ── Relations ─────────────────────────────────────
  @ManyToOne(() => Gym, (g) => g.activities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gym_id' })
  gym: Gym;

  @OneToMany(() => GymActivitySchedule, (s) => s.gymActivity)
  schedules: GymActivitySchedule[];
}
