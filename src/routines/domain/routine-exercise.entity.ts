import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Routine } from './routine.entity';
import { ExerciseCatalog } from '../../exercises/domain/exercise-catalog.entity';

@Entity('routine_exercises')
export class RoutineExercise {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer', name: 'routine_id' })
  routineId!: number;

  @Column({ type: 'integer', name: 'exercise_id' })
  exerciseId!: number;

  @Column({ type: 'integer', name: 'order_position' })
  orderPosition!: number;

  @Column({ type: 'integer', name: 'sets_recommended', nullable: true })
  setsRecommended!: number | null;

  @Column({ type: 'varchar', length: 50, name: 'reps_recommended', nullable: true })
  repsRecommended!: string | null;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    name: 'weight_recommended_kg',
    nullable: true,
  })
  weightRecommendedKg!: number;

  @Column({ type: 'varchar', length: 20, name: 'day_of_week', nullable: true })
  dayOfWeek!: string | null;

  @Column({
    type: 'integer',
    name: 'rest_seconds_between_sets',
    nullable: true,
  })
  restSecondsBetweenSets!: number;

  @Column({ type: 'text', nullable: true })
  notes!: string;

  @Column({ type: 'jsonb', nullable: true })
  params!: Record<string, any> | null;

  // ── Relations ─────────────────────────────────────
  @ManyToOne(() => Routine, (r) => r.exercises, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'routine_id' })
  routine!: Routine;

  @ManyToOne(() => ExerciseCatalog, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'exercise_id' })
  exercise!: ExerciseCatalog;
}
