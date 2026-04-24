import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
} from 'typeorm';
import { Gym } from './gym.entity';

@Entity('gym_schedules')
export class GymSchedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', name: 'gym_id' })
  gymId: number;

  @Column({ type: 'varchar', length: 10, name: 'day_of_week' })
  dayOfWeek: string;

  @Column({ type: 'time', name: 'opens_at' })
  opensAt: string;

  @Column({ type: 'time', name: 'closes_at' })
  closesAt: string;

  @Column({ type: 'boolean', name: 'is_holiday', default: false })
  isHoliday: boolean;

  // ── Relations ─────────────────────────────────────
  @ManyToOne(() => Gym, (g) => g.schedules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gym_id' })
  gym: Gym;
}
