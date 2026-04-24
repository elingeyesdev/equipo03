import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/domain/user.entity';
import { Gym } from '../../gyms/domain/gym.entity';

@Entity('check_ins')
export class CheckIn {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', name: 'user_id' })
  userId: number;

  @Column({ type: 'integer', name: 'gym_id' })
  gymId: number;

  @Column({ type: 'timestamp', name: 'check_in_time', default: () => 'now()' })
  checkInTime: Date;

  @Column({ type: 'timestamp', name: 'check_out_time', nullable: true })
  checkOutTime: Date;

  @Column({ type: 'varchar', length: 20 })
  method: string;

  @Column({ type: 'varchar', length: 20, default: 'COMPLETED' })
  status: string;

  // ── Relations ─────────────────────────────────────
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Gym, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gym_id' })
  gym: Gym;
}
