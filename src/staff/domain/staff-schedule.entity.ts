import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/domain/user.entity';
import { Gym } from '../../gyms/domain/gym.entity';

@Entity('staff_schedules')
@Index('uq_staff_schedule', ['userId', 'gymId', 'dayOfWeek'], { unique: true })
export class StaffSchedule {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer', name: 'user_id' })
  userId!: number;

  @Column({ type: 'integer', name: 'gym_id' })
  gymId!: number;

  @Column({
    type: 'integer',
    name: 'day_of_week',
    comment: '0=Domingo, 6=Sábado',
  })
  dayOfWeek!: number;

  @Column({ type: 'time', name: 'start_time' })
  startTime!: string;

  @Column({ type: 'time', name: 'end_time' })
  endTime!: string;

  // ── Relations ─────────────────────────────────────
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Gym, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gym_id' })
  gym!: Gym;
}
