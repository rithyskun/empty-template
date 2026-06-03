import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Role } from './role.entity';

@Entity('user_roles')
export class UserRole {
  @PrimaryColumn('uuid', { name: 'user_id' })
  userId: string;

  @PrimaryColumn('uuid', { name: 'role_id' })
  roleId: string;

  @Column('uuid', { name: 'tenant_id', nullable: true })
  tenantId: string;

  @Column({ name: 'assigned_at', type: 'timestamptz', default: () => 'now()' })
  assignedAt: Date;

  @Column('uuid', { name: 'assigned_by', nullable: true })
  assignedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'role_id' })
  role: Role;
}
