import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/domain/user.entity';
import { Role } from './role.entity';
import { Gym } from '../../gyms/domain/gym.entity';

@Entity('user_roles')
export class UserRole {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer', name: 'user_id' })
  userId!: number;

  @Column({ type: 'integer', name: 'role_id' })
  roleId!: number;

  @Column({ type: 'integer', name: 'gym_id', nullable: true })
  gymId!: number;

  @CreateDateColumn({ name: 'assigned_at' })
  assignedAt!: Date;

  @Column({ type: 'integer', name: 'assigned_by', nullable: true })
  assignedBy!: number;

  @Column({ type: 'timestamp', name: 'expires_at', nullable: true })
  expiresAt!: Date;

  // ── Relations ─────────────────────────────────────
  @ManyToOne(() => User, (u) => u.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Role, (r) => r.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @ManyToOne(() => Gym, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'gym_id' })
  gym!: Gym;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_by' })
  assignedByUser!: User;
}
