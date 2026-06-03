import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  VersionColumn,
} from 'typeorm';

@Entity('notification_templates')
export class NotificationTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { nullable: true })
  tenantId!: string;

  @Column({ length: 100 })
  code!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ length: 20 })
  channel!: string;

  @Column({ nullable: true })
  subject!: string;

  @Column('text')
  bodyTemplate!: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column('uuid', { nullable: true })
  createdBy!: string;

  @Column('uuid', { nullable: true })
  updatedBy!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ default: false })
  isDeleted!: boolean;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt!: Date;

  @Column('uuid', { nullable: true })
  deletedBy!: string;

  @VersionColumn()
  version!: number;
}
