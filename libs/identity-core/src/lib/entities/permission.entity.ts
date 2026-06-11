import { Entity, Column, Index } from 'typeorm';
import { AuditableEntity } from '@erp/common';

@Entity('permissions')
@Index(['slug', 'tenantId'], { unique: true })
export class Permission extends AuditableEntity {
  @Column({ length: 100 })
  name!: string;

  @Column({ length: 100, unique: true })
  slug!: string;

  @Column({ length: 50 })
  module!: string;

  @Column({ length: 50 })
  action!: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column({ name: 'is_system', default: false })
  isSystem!: boolean;
}
