import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { User } from '../../users/domain/user.entity';
import { Gym } from '../../gyms/domain/gym.entity';
import { RoutineExercise } from './routine-exercise.entity';

@Entity('routines')
export class Routine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'integer', name: 'trainer_id' })
  trainerId: number;

  @Column({ type: 'integer', name: 'assigned_user_id', nullable: true })
  assignedUserId: number;

  @Column({ type: 'integer', name: 'gym_id', nullable: true })
  gymId: number;

  @Column({ type: 'varchar', length: 30, name: 'difficulty_level' })
  difficultyLevel: string;

  @Column({ type: 'integer', name: 'duration_weeks', nullable: true })
  durationWeeks: number;

  @Column({ type: 'boolean', name: 'is_template', default: false })
  isTemplate: boolean;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamp', name: 'updated_at', nullable: true })
  updatedAt: Date;

  // ── Relations ─────────────────────────────────────
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trainer_id' })
  trainer: User;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_user_id' })
  assignedUser: User;

  @ManyToOne(() => Gym, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'gym_id' })
  gym: Gym;

  @OneToMany(() => RoutineExercise, (re) => re.routine, { cascade: true })
  exercises: RoutineExercise[];
}
