import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/domain/user.entity';

@Entity('user_training_restrictions')
export class UserTrainingRestriction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', name: 'user_id', unique: true })
  userId: number;

  @Column({ type: 'varchar', length: 50, name: 'restriction_type' })
  restrictionType: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', name: 'affected_body_areas', nullable: true })
  affectedBodyAreas: string[];

  @Column({ type: 'jsonb', name: 'movements_to_avoid', nullable: true })
  movementsToAvoid: string[];

  @Column({ type: 'boolean', name: 'requires_trainer_approval', default: false })
  requiresTrainerApproval: boolean;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamp', name: 'updated_at', nullable: true })
  updatedAt: Date;

  // ── Relations ─────────────────────────────────────
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
