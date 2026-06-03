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

  /** Token de notificación push (Expo). Nullable: solo usuarios con app instalada. */
  @Column({ name: 'push_token', type: 'varchar', length: 500, nullable: true })
  pushToken: string | null;

  /** Código OTP de 6 dígitos para recuperación de contraseña. */
  @Column({ name: 'otp_code', type: 'varchar', length: 6, nullable: true })
  otpCode: string | null;

  /** Expiración del OTP (15 min desde generación). */
  @Column({ name: 'otp_expires_at', type: 'timestamp', nullable: true })
  otpExpiresAt: Date | null;

  // ── Relations ─────────────────────────────────────
  @OneToOne(() => UserProfile, (profile) => profile.user, { cascade: true })
  profile: UserProfile;

  @OneToMany(() => UserRole, (ur) => ur.user)
  userRoles: UserRole[];

  @OneToMany(() => EmergencyContact, (ec) => ec.user)
  emergencyContacts: EmergencyContact[];
}
