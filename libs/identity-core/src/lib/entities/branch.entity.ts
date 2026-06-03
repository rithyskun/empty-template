import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AuditableEntity } from '@erp/common';
import { Company } from './company.entity';

@Entity('branches')
export class Branch extends AuditableEntity {
  @Column({ length: 255 })
  name!: string;

  @Column({ length: 50 })
  code!: string;

  @Column('text', { nullable: true })
  address?: string;

  @Column({ default: true })
  isActive!: boolean;

  @ManyToOne(() => Company, (c) => c.branches)
  @JoinColumn({ name: 'companyId' })
  company!: Company;
}
