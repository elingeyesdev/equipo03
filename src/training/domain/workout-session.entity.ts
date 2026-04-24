import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { Routine } from '../../routines/domain/routine.entity';
import { User } from '../../users/domain/user.entity';
import { Gym } from '../../gyms/domain/gym.entity';
import { WorkoutSet } from './workout-set.entity';

@Entity('workout_sessions')
export class WorkoutSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', name: 'routine_id' })
  routineId: number;

  @Column({ type: 'integer', name: 'user_id' })
  userId: number;

  @Column({ type: 'integer', name: 'gym_id' })
  gymId: number;

  @Column({ type: 'timestamp', name: 'started_at', default: () => 'now()' })
  startedAt: Date;

  @Column({ type: 'timestamp', name: 'finished_at', nullable: true })
  finishedAt: Date;

  @Column({ type: 'varchar', length: 20, default: 'IN_PROGRESS' })
  status: string;

  @Column({ type: 'integer', name: 'total_duration_minutes', nullable: true })
  totalDurationMinutes: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // ── Relations ─────────────────────────────────────
  @ManyToOne(() => Routine, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'routine_id' })
  routine: Routine;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Gym, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gym_id' })
  gym: Gym;

  @OneToMany(() => WorkoutSet, (ws) => ws.session, { cascade: true })
  sets: WorkoutSet[];
}
