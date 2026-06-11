import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Permission } from '../entities/permission.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { Role } from '../entities/role.entity';
import { UserRole } from '../entities/user-role.entity';
import {
  CreatePermissionDto,
  UpdatePermissionDto,
  PermissionResponseDto,
  PermissionStatsDto,
  PermissionUsageDto,
} from '../dto/permission.dto';
import { DomainException } from '@erp/common';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepo: Repository<RolePermission>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
  ) {}

  async create(dto: CreatePermissionDto): Promise<PermissionResponseDto> {
    const existing = await this.permissionRepo.findOne({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new DomainException(
        'Permission slug already exists',
        'PERMISSION_EXISTS',
      );
    }

    const perm = this.permissionRepo.create({
      name: dto.name,
      slug: dto.slug,
      module: dto.module,
      action: dto.action,
      description: dto.description,
      tenantId: dto.tenantId,
      isSystem: dto.isSystem ?? false,
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

    if (dto.slug && dto.slug !== perm.slug) {
      const existing = await this.permissionRepo.findOne({
        where: { slug: dto.slug },
      });
      if (existing) {
        throw new DomainException(
          'Permission slug already exists',
          'PERMISSION_EXISTS',
        );
      }
    }

    Object.assign(perm, dto);
    const saved = await this.permissionRepo.save(perm);
    return this.toResponse(saved);
  }

  async delete(id: string): Promise<void> {
    const perm = await this.permissionRepo.findOne({ where: { id } });
    if (!perm)
      throw new DomainException('Permission not found', 'PERMISSION_NOT_FOUND');
    await this.rolePermissionRepo.delete({ permissionId: id });
    await this.permissionRepo.remove(perm);
  }

  async list(params: {
    tenantId?: string;
    page?: number;
    limit?: number;
    search?: string;
    module?: string;
  }): Promise<{ data: PermissionResponseDto[]; total: number }> {
    const page = params.page || 1;
    const limit = params.limit || 20;

    const qb = this.permissionRepo.createQueryBuilder('p');

    if (params.tenantId) {
      qb.andWhere('p.tenantId = :tenantId', { tenantId: params.tenantId });
    }
    if (params.search) {
      qb.andWhere(
        '(p.name LIKE :search OR p.slug LIKE :search OR p.module LIKE :search)',
        { search: `%${params.search}%` },
      );
    }
    if (params.module) {
      qb.andWhere('p.module = :module', { module: params.module });
    }

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('p.createdAt', 'DESC')
      .getManyAndCount();

    const enriched = await Promise.all(
      data.map(async (p) => this.toResponseWithCount(p)),
    );
    return { data: enriched, total };
  }

  async findById(id: string): Promise<PermissionResponseDto | null> {
    const perm = await this.permissionRepo.findOne({ where: { id } });
    if (!perm) return null;
    return this.toResponseWithCount(perm);
  }

  async getRolePermissions(roleId: string): Promise<PermissionResponseDto[]> {
    const links = await this.rolePermissionRepo.find({
      where: { roleId },
      select: { permissionId: true },
    });
    if (!links.length) return [];

    const permIds = links.map((l) => l.permissionId);
    const perms = await this.permissionRepo.find({
      where: { id: In(permIds) },
      order: { module: 'ASC', action: 'ASC' },
    });
    return perms.map((p) => this.toResponse(p));
  }

  async setRolePermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<PermissionResponseDto[]> {
    const role = await this.roleRepo.findOne({ where: { id: roleId } });
    if (!role) throw new DomainException('Role not found', 'ROLE_NOT_FOUND');

    await this.rolePermissionRepo.delete({ roleId });

    if (!permissionIds.length) return [];

    const validPerms = await this.permissionRepo.findBy({
      id: In(permissionIds),
    });
    if (validPerms.length !== permissionIds.length) {
      throw new DomainException(
        'One or more permissions not found',
        'PERMISSION_NOT_FOUND',
      );
    }

    const links = permissionIds.map((id) =>
      this.rolePermissionRepo.create({ roleId, permissionId: id }),
    );
    await this.rolePermissionRepo.save(links);

    return validPerms.map((p: Permission) => this.toResponse(p));
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const userRoles = await this.userRoleRepo.find({
      where: { userId },
      select: { roleId: true },
    });
    if (!userRoles.length) return [];

    const roleIds = userRoles.map((ur) => ur.roleId);
    const links = await this.rolePermissionRepo.find({
      where: { roleId: In(roleIds) },
      select: { permissionId: true },
    });
    if (!links.length) return [];

    const permIds = [...new Set(links.map((l) => l.permissionId))];
    const perms = await this.permissionRepo.find({
      where: { id: In(permIds) },
      select: { slug: true },
    });

    return [...new Set(perms.map((p) => p.slug))];
  }

  async hasPermission(
    userId: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    const perms = await this.getUserPermissions(userId);
    return perms.includes(`${resource}:${action}`) || perms.includes('all:all');
  }

  async getPermissionStats(): Promise<PermissionStatsDto> {
    const total = await this.permissionRepo.count();
    const system = await this.permissionRepo.count({
      where: { isSystem: true },
    });
    const roleCount = await this.rolePermissionRepo.count();

    const usedPermIds = await this.rolePermissionRepo
      .createQueryBuilder('rp')
      .select('DISTINCT rp.permissionId', 'id')
      .getRawMany();

    return {
      total,
      system,
      user: 0, // placeholder if needed later
      role: roleCount,
      permission: total,
      unused: total - usedPermIds.length,
    };
  }

  async getPermissionUsage(): Promise<PermissionUsageDto[]> {
    const allPerms = await this.permissionRepo.find({
      order: { module: 'ASC', action: 'ASC' },
    });

    const result: PermissionUsageDto[] = [];
    for (const perm of allPerms) {
      const roleCount = await this.rolePermissionRepo.count({
        where: { permissionId: perm.id },
      });
      result.push({
        permission: this.toResponse(perm),
        roleCount,
      });
    }
    return result;
  }

  private toResponse(perm: Permission): PermissionResponseDto {
    return {
      id: perm.id,
      name: perm.name,
      slug: perm.slug,
      module: perm.module,
      action: perm.action,
      description: perm.description,
      isSystem: perm.isSystem,
      tenantId: perm.tenantId,
      createdAt: perm.createdAt,
      updatedAt: perm.updatedAt,
    };
  }

  private async toResponseWithCount(
    perm: Permission,
  ): Promise<PermissionResponseDto> {
    const rolesCount = await this.rolePermissionRepo.count({
      where: { permissionId: perm.id },
    });
    return { ...this.toResponse(perm), rolesCount };
  }
}
