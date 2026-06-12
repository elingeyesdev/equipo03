import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/domain/user.entity';

@Entity('user_notification_preferences')
export class UserNotificationPreference {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer', name: 'user_id', unique: true })
  userId!: number;

  @Column({ type: 'boolean', name: 'enable_push', default: true })
  enablePush!: boolean;

  @Column({ type: 'boolean', name: 'reservation_confirmations', default: true })
  reservationConfirmations!: boolean;

  @Column({ type: 'boolean', name: 'class_reminders', default: true })
  classReminders!: boolean;

  @Column({ type: 'boolean', name: 'cancellations_alerts', default: true })
  cancellationsAlerts!: boolean;

  @Column({ type: 'boolean', name: 'promotional_content', default: false })
  promotionalContent!: boolean;

  @Column({ type: 'timestamp', name: 'updated_at', default: () => 'now()' })
  updatedAt!: Date;

  // ── Relations ─────────────────────────────────────
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
