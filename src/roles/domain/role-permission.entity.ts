import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Role } from './role.entity';
import { Permission } from './permission.entity';
import { User } from '../../users/domain/user.entity';

@Entity('role_permissions')
export class RolePermission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', name: 'role_id' })
  roleId: number;

  @Column({ type: 'integer', name: 'permission_id' })
  permissionId: number;

  @CreateDateColumn({ name: 'granted_at' })
  grantedAt: Date;

  @Column({ type: 'integer', name: 'granted_by', nullable: true })
  grantedBy: number;

  // ── Relations ─────────────────────────────────────
  @ManyToOne(() => Role, (r) => r.rolePermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => Permission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'granted_by' })
  grantedByUser: User;
}
