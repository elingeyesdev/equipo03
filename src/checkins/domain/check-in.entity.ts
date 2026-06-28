import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/domain/user.entity';
import { Gym } from '../../gyms/domain/gym.entity';

@Entity('check_ins')
export class CheckIn {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index('idx_check_ins_user_id')
  @Column({ type: 'integer', name: 'user_id' })
  userId!: number;

  @Index('idx_check_ins_gym_id')
  @Column({ type: 'integer', name: 'gym_id' })
  gymId!: number;

  @Column({ type: 'timestamp', name: 'check_in_time', default: () => 'now()' })
  checkInTime!: Date;

  @Column({ type: 'timestamp', name: 'check_out_time', nullable: true })
  checkOutTime!: Date;

  @Column({ type: 'varchar', length: 20 })
  method!: string;

  @Column({ type: 'varchar', length: 20, default: 'COMPLETED' })
  status!: string;

  @Column({ type: 'varchar', length: 10, name: 'action_type', nullable: true })
  actionType!: string | null;

  // ── Relations ─────────────────────────────────────
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Gym, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gym_id' })
  gym!: Gym;
}
