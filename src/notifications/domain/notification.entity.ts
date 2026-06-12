import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/domain/user.entity';
import { NotificationTemplate } from './notification-template.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer', name: 'user_id' })
  userId!: number;

  @Column({ type: 'integer', name: 'template_id', nullable: true })
  templateId!: number;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  body!: string;

  @CreateDateColumn({ name: 'sent_at' })
  sentAt!: Date;

  @Column({ type: 'timestamp', name: 'read_at', nullable: true })
  readAt!: Date;

  @Column({ type: 'varchar', length: 20, default: 'SENT' })
  status!: string;

  // ── Relations ─────────────────────────────────────
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => NotificationTemplate, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'template_id' })
  template!: NotificationTemplate;
}
