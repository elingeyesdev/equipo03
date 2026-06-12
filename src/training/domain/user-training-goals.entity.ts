import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { UserTraining } from './user-training.entity';

@Entity('user_training_goals')
export class UserTrainingGoals {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer', name: 'user_training_id', unique: true })
  userTrainingId!: number;

  @Column({ type: 'varchar', length: 50, name: 'primary_goal' })
  primaryGoal!: string;

  @Column({ type: 'varchar', length: 30, name: 'experience_level' })
  experienceLevel!: string;

  // ── Relations ─────────────────────────────────────
  @OneToOne(() => UserTraining, (ut) => ut.goals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_training_id' })
  userTraining!: UserTraining;
}
