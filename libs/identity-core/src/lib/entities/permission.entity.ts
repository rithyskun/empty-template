import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import type { Relation } from 'typeorm';
import { AuditableEntity } from '@erp/common';
import { Role } from './role.entity';

@Entity('permissions')
@Unique(['roleId', 'resource', 'action'])
export class Permission extends AuditableEntity {
  @Column('uuid', { name: 'role_id' })
  roleId!: string;

  @Column({ length: 100 })
  resource!: string;

  @Column({ length: 50 })
  action!: string;

  @ManyToOne(() => Role, (r) => r.permissions)
  @JoinColumn({ name: 'role_id' })
  role!: Relation<Role>;
}
