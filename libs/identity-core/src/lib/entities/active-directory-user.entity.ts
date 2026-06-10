import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { AuditableEntity } from '@erp/common';
import { User } from './user.entity';
import type { Relation } from 'typeorm';

@Entity('active_directory_users')
export class ActiveDirectoryUser extends AuditableEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: Relation<User>;

  @Column({ name: 'ad_object_id', length: 255, nullable: true })
  adObjectId?: string;

  @Column({ name: 'dn', length: 500 })
  dn!: string;

  @Column({ name: 'sam_account_name', length: 100 })
  sAMAccountName!: string;

  @Column({ name: 'domain', length: 255 })
  domain!: string;

  @Column({ name: 'first_seen_at', type: 'timestamptz' })
  firstSeenAt!: Date;

  @Column({ name: 'last_synced_at', type: 'timestamptz' })
  lastSyncedAt!: Date;

  @Column({ type: 'jsonb', nullable: true })
  adAttributes?: Record<string, unknown>;
}
