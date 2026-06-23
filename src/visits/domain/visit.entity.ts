import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/domain/user.entity';
import { Gym } from '../../gyms/domain/gym.entity';

@Entity('visits')
export class Visit {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index('idx_visits_user_id')
  @Column({ type: 'integer', name: 'user_id' })
  userId!: number;

  @Index('idx_visits_gym_id')
  @Column({ type: 'integer', name: 'gym_id' })
  gymId!: number;

  /** Timestamp de cuando el GPS detectó la entrada al gimnasio */
  @Column({ type: 'timestamp', name: 'entered_at' })
  enteredAt!: Date;

  /** Timestamp de cuando el GPS detectó la salida (puede llegar después) */
  @Column({ type: 'timestamp', name: 'exited_at', nullable: true })
  exitedAt!: Date | null;

  /** Duración de la visita en minutos (calculada en el cliente por GPS) */
  @Column({ type: 'integer', name: 'duration_min', nullable: true })
  durationMin!: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // ── Relations ─────────────────────────────────────
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Gym, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gym_id' })
  gym!: Gym;
}
