import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity('trainer_plans')
@Unique('uq_trainer_client_plan', ['trainerId', 'clientId'])
export class TrainerPlan {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer', name: 'trainer_id' })
  trainerId!: number;

  @Column({ type: 'integer', name: 'client_id' })
  clientId!: number;

  @Column({ type: 'integer', name: 'daily_kcal', nullable: true })
  dailyKcal?: number;

  @Column({ type: 'decimal', precision: 6, scale: 1, name: 'protein_g', nullable: true })
  proteinG?: number;

  @Column({ type: 'decimal', precision: 6, scale: 1, name: 'carbs_g', nullable: true })
  carbsG?: number;

  @Column({ type: 'decimal', precision: 6, scale: 1, name: 'fat_g', nullable: true })
  fatG?: number;

  @Column({ type: 'text', name: 'plan_notes', nullable: true })
  planNotes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
