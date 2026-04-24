import {
  Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn,
} from 'typeorm';
import { UserTraining } from './user-training.entity';

@Entity('user_training_preferences')
export class UserTrainingPreferences {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', name: 'user_training_id', unique: true })
  userTrainingId: number;

  @Column({ type: 'jsonb', name: 'preferred_training_types', nullable: true })
  preferredTrainingTypes: string[];

  @Column({ type: 'jsonb', name: 'priority_body_areas', nullable: true })
  priorityBodyAreas: string[];

  @Column({ type: 'integer', name: 'available_days_per_week', nullable: true })
  availableDaysPerWeek: number;

  // ── Relations ─────────────────────────────────────
  @OneToOne(() => UserTraining, (ut) => ut.preferences, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_training_id' })
  userTraining: UserTraining;
}
