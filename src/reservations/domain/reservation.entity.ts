import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/domain/user.entity';
import { Gym } from '../../gyms/domain/gym.entity';
import { GymActivity } from '../../activities/domain/gym-activity.entity';
import { GymActivitySchedule } from '../../activities/domain/gym-activity-schedule.entity';

@Index('idx_reservations_user_status', ['userId', 'status'])
@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index('idx_reservations_user_id')
  @Column({ type: 'integer', name: 'user_id' })
  userId!: number;

  /**
   * NULL cuando la reserva es de acceso libre (isFreeAccess).
   * Apunta a un horario concreto en flujo estándar.
   */
  @Index('idx_reservations_schedule_id')
  @Column({ type: 'integer', name: 'gym_activity_schedule_id', nullable: true })
  gymActivityScheduleId!: number | null;

  /**
   * Sede. Obligatorio en flujo libre; derivable del schedule en flujo estándar.
   */
  @Column({ type: 'integer', name: 'gym_id', nullable: true })
  gymId!: number | null;

  /**
   * Actividad. Obligatorio en flujo libre; derivable del schedule en flujo estándar.
   */
  @Column({ type: 'integer', name: 'activity_id', nullable: true })
  activityId!: number | null;

  @Column({ type: 'date', name: 'reservation_date' })
  reservationDate!: Date;

  /**
   * Flujo libre: viene del DTO (cliente elige hora).
   * Flujo programado: copiado del GymActivitySchedule de la BD (el cliente no lo dicta).
   */
  @Column({ type: 'time', name: 'start_time', nullable: true })
  startTime!: string | null;

  @Column({ type: 'time', name: 'end_time', nullable: true })
  endTime!: string | null;

  @Column({ type: 'varchar', length: 20 })
  status!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ type: 'timestamp', name: 'cancelled_at', nullable: true })
  cancelledAt!: Date;

  @Column({ type: 'integer', name: 'created_by' })
  createdBy!: number;

  /** Token opaco generado al crear la reserva. Es el secreto que lleva el QR. */
  @Column({
    name: 'qr_token',
    type: 'varchar',
    length: 36,
    unique: true,
    nullable: true,
  })
  qrToken!: string | null;

  // ── Relations ─────────────────────────────────────
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdByUser?: User;

  @ManyToOne(() => GymActivitySchedule, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'gym_activity_schedule_id' })
  gymActivitySchedule!: GymActivitySchedule | null;

  @ManyToOne(() => Gym, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'gym_id' })
  gym!: Gym | null;

  @ManyToOne(() => GymActivity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'activity_id' })
  activity!: GymActivity | null;
}
