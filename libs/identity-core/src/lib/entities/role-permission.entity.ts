import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('role_permissions')
export class RolePermission {
  @PrimaryColumn('uuid', { name: 'role_id' })
  roleId!: string;

  @PrimaryColumn('uuid', { name: 'permission_id' })
  permissionId!: string;

  @Column('uuid', { name: 'tenant_id', nullable: true })
  tenantId?: string;
}
