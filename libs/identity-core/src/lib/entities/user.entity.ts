import { Entity, Column } from 'typeorm';
import { AuditableEntity } from '@erp/common';

@Entity('users')
export class User extends AuditableEntity {
  @Column({ length: 255, unique: true })
  email!: string;

  @Column({ length: 50, nullable: true })
  phone?: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash!: string;

  @Column({ name: 'first_name', length: 100 })
  firstName!: string;

  @Column({ name: 'last_name', length: 100 })
  lastName!: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'must_change_pwd', default: false })
  mustChangePwd!: boolean;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt?: Date;

  @Column({ name: 'is_two_factor_enabled', default: false })
  isTwoFactorEnabled!: boolean;

  @Column({ name: 'two_factor_secret', length: 255, nullable: true })
  twoFactorSecret?: string;
}
