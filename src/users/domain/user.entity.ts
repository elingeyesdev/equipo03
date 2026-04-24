import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, OneToMany,
} from 'typeorm';
import { UserProfile } from './user-profile.entity';
import { UserRole } from '../../roles/domain/user-role.entity';
import { EmergencyContact } from '../../training/domain/emergency-contact.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamp', name: 'updated_at', nullable: true })
  updatedAt: Date;

  // ── Relations ─────────────────────────────────────
  @OneToOne(() => UserProfile, (profile) => profile.user, { cascade: true })
  profile: UserProfile;

  @OneToMany(() => UserRole, (ur) => ur.user)
  userRoles: UserRole[];

  @OneToMany(() => EmergencyContact, (ec) => ec.user)
  emergencyContacts: EmergencyContact[];
}
