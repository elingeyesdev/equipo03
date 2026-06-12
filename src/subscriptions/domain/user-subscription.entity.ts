import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/domain/user.entity';
import { SubscriptionPlan } from './subscription-plan.entity';
import { Gym } from '../../gyms/domain/gym.entity';

@Entity('user_subscriptions')
export class UserSubscription {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer', name: 'user_id' })
  userId!: number;

  @Column({ type: 'integer', name: 'plan_id' })
  planId!: number;

  @Column({ type: 'integer', name: 'home_gym_id', nullable: true })
  homeGymId!: number;

  @Column({ type: 'varchar', length: 20 })
  status!: string;

  @Column({ type: 'date', name: 'start_date' })
  startDate!: Date;

  @Column({ type: 'date', name: 'end_date' })
  endDate!: Date;

  @Column({ type: 'boolean', name: 'auto_renew', default: false })
  autoRenew!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ type: 'timestamp', name: 'updated_at', nullable: true })
  updatedAt!: Date;

  // ── Relations ─────────────────────────────────────
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => SubscriptionPlan, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'plan_id' })
  plan!: SubscriptionPlan;

  @ManyToOne(() => Gym, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'home_gym_id' })
  homeGym!: Gym;
}
