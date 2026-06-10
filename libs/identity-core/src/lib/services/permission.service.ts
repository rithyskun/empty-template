import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Permission } from '../entities/permission.entity';
import { Role } from '../entities/role.entity';
import { UserRole } from '../entities/user-role.entity';
import {
  CreatePermissionDto,
  UpdatePermissionDto,
  PermissionResponseDto,
  RolePermissionDto,
} from '../dto/permission.dto';
import { DomainException } from '@erp/common';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
  ) {}

  async create(dto: CreatePermissionDto): Promise<PermissionResponseDto> {
    const role = await this.roleRepo.findOne({ where: { id: dto.roleId } });
    if (!role) throw new DomainException('Role not found', 'ROLE_NOT_FOUND');

    const existing = await this.permissionRepo.findOne({
      where: {
        roleId: dto.roleId,
        resource: dto.resource,
        action: dto.action,
      },
    });
    if (existing) {
      throw new DomainException(
        'Permission already exists for this role',
        'PERMISSION_EXISTS',
      );
    }

    const perm = this.permissionRepo.create({
      roleId: dto.roleId,
      resource: dto.resource,
      action: dto.action,
      tenantId: dto.tenantId,
    });
    const saved = await this.permissionRepo.save(perm);
    return this.toResponse(saved);
  }

  async update(
    id: string,
    dto: UpdatePermissionDto,
  ): Promise<PermissionResponseDto> {
    const perm = await this.permissionRepo.findOne({ where: { id } });
    if (!perm)
      throw new DomainException('Permission not found', 'PERMISSION_NOT_FOUND');

    Object.assign(perm, dto);
    const saved = await this.permissionRepo.save(perm);
    return this.toResponse(saved);
  }

  async delete(id: string): Promise<void> {
    const perm = await this.permissionRepo.findOne({ where: { id } });
    if (!perm)
      throw new DomainException('Permission not found', 'PERMISSION_NOT_FOUND');
    await this.permissionRepo.remove(perm);
  }

  async list(params: {
    roleId?: string;
    tenantId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: PermissionResponseDto[]; total: number }> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const where: Record<string, unknown> = {};
    if (params.roleId) where['roleId'] = params.roleId;
    if (params.tenantId) where['tenantId'] = params.tenantId;

    const [data, total] = await this.permissionRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { data: data.map((p) => this.toResponse(p)), total };
  }

  async findById(id: string): Promise<PermissionResponseDto | null> {
    const perm = await this.permissionRepo.findOne({ where: { id } });
    if (!perm) return null;
    return this.toResponse(perm);
  }

  async getRolePermissions(roleId: string): Promise<PermissionResponseDto[]> {
    const perms = await this.permissionRepo.find({
      where: { roleId },
      order: { resource: 'ASC', action: 'ASC' },
    });
    return perms.map((p) => this.toResponse(p));
  }

  async setRolePermissions(
    roleId: string,
    permissions: RolePermissionDto[],
  ): Promise<PermissionResponseDto[]> {
    const role = await this.roleRepo.findOne({ where: { id: roleId } });
    if (!role) throw new DomainException('Role not found', 'ROLE_NOT_FOUND');

    await this.permissionRepo.delete({ roleId });

    if (!permissions.length) return [];

    const entities = permissions.map((p) =>
      this.permissionRepo.create({
        roleId,
        resource: p.resource,
        action: p.action,
      }),
    );
    const saved = await this.permissionRepo.save(entities);
    return saved.map((p) => this.toResponse(p));
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const userRoles = await this.userRoleRepo.find({
      where: { userId },
      select: { roleId: true },
    });
    if (!userRoles.length) return [];

    const roleIds = userRoles.map((ur) => ur.roleId);
    const perms = await this.permissionRepo.find({
      where: { roleId: In(roleIds) },
      select: { resource: true, action: true },
    });

    const unique = new Set(perms.map((p) => `${p.resource}:${p.action}`));
    return Array.from(unique);
  }

  async hasPermission(
    userId: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    const perms = await this.getUserPermissions(userId);
    return perms.includes(`${resource}:${action}`) || perms.includes('all:all');
  }

  private toResponse(perm: Permission): PermissionResponseDto {
    return {
      id: perm.id,
      roleId: perm.roleId,
      resource: perm.resource,
      action: perm.action,
      tenantId: perm.tenantId,
      createdAt: perm.createdAt,
      updatedAt: perm.updatedAt,
    };
  }
}
