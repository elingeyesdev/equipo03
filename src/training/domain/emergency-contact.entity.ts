import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/domain/user.entity';

@Entity('emergency_contacts')
export class EmergencyContact {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer', name: 'user_id' })
  userId!: number;

  @Column({ type: 'varchar', length: 150, name: 'full_name' })
  fullName!: string;

  @Column({ type: 'varchar', length: 20 })
  phone!: string;

  @Column({ type: 'varchar', length: 50 })
  relation!: string;

  @Column({ type: 'boolean', name: 'is_primary', default: false })
  isPrimary!: boolean;

  // ── Relations ─────────────────────────────────────
  @ManyToOne(() => User, (u) => u.emergencyContacts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
