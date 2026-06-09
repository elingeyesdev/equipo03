import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { WorkoutSession } from './workout-session.entity';
import { RoutineExercise } from '../../routines/domain/routine-exercise.entity';

@Entity('workout_sets')
export class WorkoutSet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', name: 'session_id' })
  sessionId: number;

  @Column({ type: 'integer', name: 'routine_exercise_id', nullable: true })
  routineExerciseId: number | null;

  @Column({ type: 'integer', name: 'set_number' })
  setNumber: number;

  @Column({ type: 'integer', name: 'reps_completed', nullable: true })
  repsCompleted: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'weight_used_kg', nullable: true })
  weightUsedKg: number | null;

  @Column({ type: 'integer', name: 'duration_seconds', nullable: true })
  durationSeconds: number | null;

  @Column({ type: 'integer', name: 'distance_meters', nullable: true })
  distanceMeters: number | null;

  @Column({ type: 'integer', name: 'rest_taken_seconds', nullable: true })
  restTakenSeconds: number | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'completed_at' })
  completedAt: Date;

  @Column({ type: 'integer', name: 'rating_perceived_exertion', nullable: true })
  ratingPerceivedExertion: number | null;

  // ── Relations ─────────────────────────────────────
  @ManyToOne(() => WorkoutSession, (ws) => ws.sets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: WorkoutSession;

  @ManyToOne(() => RoutineExercise, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'routine_exercise_id' })
  routineExercise: RoutineExercise | null;
}
