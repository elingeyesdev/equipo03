import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/domain/user.entity';

export type AdvisorStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'CANCELLED';

@Entity('client_advisors')
@Unique('uq_client_advisor', ['clientId', 'advisorId'])
export class ClientAdvisor {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer', name: 'client_id' })
  clientId!: number;

  @Column({ type: 'integer', name: 'advisor_id' })
  advisorId!: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'PENDING',
  })
  status!: AdvisorStatus;

  @Column({ type: 'int', name: 'target_sessions_per_week', nullable: true, default: null })
  targetSessionsPerWeek!: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // ── Relations ─────────────────────────────────────
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client!: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'advisor_id' })
  advisor!: User;
}
