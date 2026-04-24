import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Reservation } from '../../reservations/domain/reservation.entity';
import { User } from '../../users/domain/user.entity';
import { GymActivitySchedule } from '../../activities/domain/gym-activity-schedule.entity';

@Entity('waitlist_entries')
export class WaitlistEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', name: 'reservation_id', nullable: true })
  reservationId: number;

  @Column({ type: 'integer', name: 'user_id' })
  userId: number;

  @Column({ type: 'integer', name: 'gym_activity_schedule_id' })
  gymActivityScheduleId: number;

  @Column({ type: 'integer', name: 'position_in_queue' })
  positionInQueue: number;

  @Column({ type: 'varchar', length: 20, default: 'WAITING' })
  status: string;

  @Column({ type: 'timestamp', name: 'notified_at', nullable: true })
  notifiedAt: Date;

  @Column({ type: 'timestamp', name: 'assigned_at', nullable: true })
  assignedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // ── Relations ─────────────────────────────────────
  @ManyToOne(() => Reservation, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reservation_id' })
  reservation: Reservation;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => GymActivitySchedule, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gym_activity_schedule_id' })
  gymActivitySchedule: GymActivitySchedule;
}
