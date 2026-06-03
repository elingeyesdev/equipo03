import {
  Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn,
} from 'typeorm';
import type { PhysicalMetricsHistory } from '../../metrics/domain/physical-metrics-history.entity';
import { User } from './user.entity';

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', name: 'user_id', unique: true })
  userId: number;

  @Column({ type: 'varchar', length: 100, name: 'first_name' })
  firstName: string;

  @Column({ type: 'varchar', length: 100, name: 'last_name' })
  lastName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'date', name: 'date_of_birth', nullable: true })
  dateOfBirth: Date;

  @Column({ type: 'varchar', length: 30, nullable: true })
  gender: string;

  @Column({ name: 'ci', type: 'varchar', unique: true, nullable: true })
  ci: string;

  @Column({ name: 'height_cm', type: 'decimal', precision: 5, scale: 2, nullable: true })
  heightCm: number;

  @Column({ name: 'experience_level', type: 'varchar', length: 50, nullable: true })
  experienceLevel: string;

  @Column({ name: 'medical_conditions', type: 'text', nullable: true })
  medicalConditions: string;

  @Column({ name: 'favorite_sports', type: 'jsonb', nullable: true })
  favoriteSports: string[];

  @Column({ name: 'avatar_url', type: 'varchar', length: 500, nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  username: string | null;

  /** Campo virtual — no persistido en BD. Se inyecta en runtime desde physical_metrics_history. */
  physicalMetrics?: PhysicalMetricsHistory | null;

  // ── Relations ─────────────────────────────────────
  @OneToOne(() => User, (u) => u.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
