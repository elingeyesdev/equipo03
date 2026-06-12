import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/domain/user.entity';

@Entity('system_settings')
export class SystemSetting {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100, name: 'setting_key', unique: true })
  settingKey!: string;

  @Column({ type: 'jsonb', name: 'setting_value' })
  settingValue!: any;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ type: 'timestamp', name: 'updated_at', default: () => 'now()' })
  updatedAt!: Date;

  @Column({ type: 'integer', name: 'updated_by', nullable: true })
  updatedBy!: number;

  // ── Relations ─────────────────────────────────────
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'updated_by' })
  updatedByUser!: User;
}
