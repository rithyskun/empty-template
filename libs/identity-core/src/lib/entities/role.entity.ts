import { Entity, Column } from 'typeorm';
import { AuditableEntity } from '@erp/common';

@Entity('roles')
export class Role extends AuditableEntity {
  @Column({ length: 100 })
  name!: string;

  @Column({ length: 50 })
  code!: string;

  @Column({ length: 50, nullable: true })
  slug?: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column({ default: false })
  isSystem!: boolean;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;
}
