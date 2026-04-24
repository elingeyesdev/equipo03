import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { GymActivitySchedule } from './gym-activity-schedule.entity';
import { User } from '../../users/domain/user.entity';

@Entity('gym_activity_attendance')
export class GymActivityAttendance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', name: 'gym_activity_schedule_id' })
  gymActivityScheduleId: number;

  @Column({ type: 'integer', name: 'user_id' })
  userId: number;

  @CreateDateColumn({ name: 'check_in_time' })
  checkInTime: Date;

  @Column({ type: 'timestamp', name: 'check_out_time', nullable: true })
  checkOutTime: Date;

  @Column({ type: 'varchar', length: 20, default: 'CONFIRMED' })
  status: string;

  // ── Relations ─────────────────────────────────────
  @ManyToOne(() => GymActivitySchedule, (s) => s.attendances, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gym_activity_schedule_id' })
  gymActivitySchedule: GymActivitySchedule;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
