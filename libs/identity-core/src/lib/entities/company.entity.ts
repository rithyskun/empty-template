import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { AuditableEntity } from '@erp/common';
import { Tenant } from './tenant.entity';
import { Branch } from './branch.entity';

@Entity('companies')
export class Company extends AuditableEntity {
  @Column({ length: 255 })
  name!: string;

  @Column({ length: 50 })
  code!: string;

  @Column({ nullable: true })
  taxId?: string;

  @Column({ default: true })
  isActive!: boolean;

  @ManyToOne(() => Tenant, (t) => t.companies)
  @JoinColumn({ name: 'tenantId' })
  tenant!: Tenant;

  @OneToMany(() => Branch, (b) => b.company)
  branches!: Branch[];
}
