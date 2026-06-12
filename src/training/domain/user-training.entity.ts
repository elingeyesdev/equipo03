import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/domain/user.entity';
import { UserTrainingGoals } from './user-training-goals.entity';
import { UserTrainingPreferences } from './user-training-preferences.entity';

@Entity('user_training')
export class UserTraining {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer', name: 'user_id', unique: true })
  userId!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // ── Relations ─────────────────────────────────────
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @OneToOne(() => UserTrainingGoals, (g) => g.userTraining, { cascade: true })
  goals!: UserTrainingGoals;

  @OneToOne(() => UserTrainingPreferences, (p) => p.userTraining, {
    cascade: true,
  })
  preferences!: UserTrainingPreferences;
}
