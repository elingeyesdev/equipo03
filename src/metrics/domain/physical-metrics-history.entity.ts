import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/domain/user.entity';
import { Gym } from '../../gyms/domain/gym.entity';

@Entity('physical_metrics_history')
export class PhysicalMetricsHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer', name: 'user_id' })
  userId!: number;

  @CreateDateColumn({ name: 'recorded_at' })
  recordedAt!: Date;

  @Column({ type: 'integer', name: 'gym_id', nullable: true })
  gymId!: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    name: 'weight_kg',
    nullable: true,
  })
  weightKg!: number;

  @Column({
    type: 'decimal',
    precision: 4,
    scale: 2,
    name: 'body_fat_percentage',
    nullable: true,
  })
  bodyFatPercentage!: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    name: 'muscle_mass_kg',
    nullable: true,
  })
  muscleMassKg!: number;

  @Column({
    type: 'decimal',
    precision: 4,
    scale: 2,
    name: 'waist_cm',
    nullable: true,
  })
  waistCm!: number;

  @Column({
    type: 'decimal',
    precision: 4,
    scale: 2,
    name: 'chest_cm',
    nullable: true,
  })
  chestCm!: number;

  @Column({ type: 'decimal', precision: 4, scale: 2, name: 'hip_cm', nullable: true })
  hipCm!: number;

  @Column({ type: 'decimal', precision: 4, scale: 2, name: 'mid_arm_cm', nullable: true })
  midArmCm!: number;

  @Column({ type: 'decimal', precision: 4, scale: 2, name: 'thigh_cm', nullable: true })
  thighCm!: number;

  @Column({ type: 'decimal', precision: 4, scale: 2, name: 'calf_cm', nullable: true })
  calfCm!: number;

  @Column({ type: 'text', nullable: true })
  notes!: string;

  // ── Relations ─────────────────────────────────────
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Gym, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'gym_id' })
  gym!: Gym;
}
