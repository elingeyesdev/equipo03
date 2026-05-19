import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/domain/user.entity';
import { GymActivitySchedule } from '../../activities/domain/gym-activity-schedule.entity';

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', name: 'user_id' })
  userId: number;

  @Column({ type: 'integer', name: 'gym_activity_schedule_id' })
  gymActivityScheduleId: number;

  @Column({ type: 'date', name: 'reservation_date' })
  reservationDate: Date;

  @Column({ type: 'varchar', length: 20 })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamp', name: 'cancelled_at', nullable: true })
  cancelledAt: Date;

  @Column({ type: 'integer', name: 'created_by' })
  createdBy: number;

  // ── Relations ─────────────────────────────────────
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdByUser?: User;

  @ManyToOne(() => GymActivitySchedule, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gym_activity_schedule_id' })
  gymActivitySchedule: GymActivitySchedule;
}
