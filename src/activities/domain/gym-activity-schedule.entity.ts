import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { GymActivity } from './gym-activity.entity';
import { User } from '../../users/domain/user.entity';
import { GymActivityAttendance } from './gym-activity-attendance.entity';

@Entity('gym_activity_schedule')
export class GymActivitySchedule {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer', name: 'gym_activity_id' })
  gymActivityId!: number;

  @Column({ type: 'integer', name: 'instructor_id', nullable: true })
  instructorId!: number;

  @Column({ type: 'varchar', length: 10, name: 'day_of_week' })
  dayOfWeek!: string;

  @Column({ type: 'time', name: 'start_time' })
  startTime!: string;

  @Column({ type: 'time', name: 'end_time' })
  endTime!: string;

  @Column({ type: 'integer', name: 'max_attendees' })
  maxAttendees!: number;

  @Column({ type: 'boolean', name: 'is_recurring', default: true })
  isRecurring!: boolean;

  // ── Relations ─────────────────────────────────────
  @ManyToOne(() => GymActivity, (a) => a.schedules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gym_activity_id' })
  gymActivity!: GymActivity;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'instructor_id' })
  instructor!: User;

  @OneToMany(() => GymActivityAttendance, (att) => att.gymActivitySchedule)
  attendances!: GymActivityAttendance[];
}
