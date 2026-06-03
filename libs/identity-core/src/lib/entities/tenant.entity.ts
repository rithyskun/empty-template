import { Entity, Column, OneToMany } from 'typeorm';
import { AuditableEntity } from '@erp/common';
import { Company } from './company.entity';

@Entity('tenants')
export class Tenant extends AuditableEntity {
  @Column({ length: 255 })
  name!: string;

  @Column({ length: 100, unique: true })
  slug!: string;

  @Column({ nullable: true })
  domain?: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column('jsonb', { default: {} })
  settings!: Record<string, unknown>;

  @OneToMany(() => Company, (c) => c.tenant)
  companies!: Company[];
}
