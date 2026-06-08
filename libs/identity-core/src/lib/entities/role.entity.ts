import { Entity, Column, OneToMany } from 'typeorm';
import type { Relation } from 'typeorm';
import { AuditableEntity } from '@erp/common';
import { Permission } from './permission.entity';

@Entity('roles')
export class Role extends AuditableEntity {
  @Column({ length: 100 })
  name!: string;

  @Column({ length: 50 })
  code!: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column({ default: false })
  isSystem!: boolean;

  @OneToMany(() => Permission, (p) => p.role)
  permissions!: Relation<Permission[]>;
}
