import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { UserRole } from '../entities/user-role.entity';
import {
  CreateRoleDto,
  UpdateRoleDto,
  RoleResponseDto,
  RoleStatsDto,
} from '../dto/role.dto';
import { DomainException } from '@erp/common';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepo: Repository<RolePermission>,
    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
  ) {}

  async create(dto: CreateRoleDto): Promise<RoleResponseDto> {
    const existing = await this.roleRepo.findOne({
      where: { code: dto.code, tenantId: dto.tenantId ?? '' },
    });
    if (existing) {
      throw new DomainException('Role code already exists', 'ROLE_EXISTS');
    }

    const role = this.roleRepo.create({
      name: dto.name,
      code: dto.code,
      slug: dto.slug ?? dto.code,
      description: dto.description,
      tenantId: dto.tenantId,
      isSystem: dto.isSystem ?? false,
      isActive: dto.isActive ?? true,
    });
    const saved = await this.roleRepo.save(role);

    if (dto.permissionIds?.length) {
      const links = dto.permissionIds.map((pid) =>
        this.rolePermissionRepo.create({
          roleId: saved.id,
          permissionId: pid,
          tenantId: dto.tenantId,
        }),
      );
      await this.rolePermissionRepo.save(links);
    }

    return this.toResponse(saved);
  }

  async update(id: string, dto: UpdateRoleDto): Promise<RoleResponseDto> {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) throw new DomainException('Role not found', 'ROLE_NOT_FOUND');

    Object.assign(role, dto);
    const saved = await this.roleRepo.save(role);

    if (dto.permissionIds !== undefined) {
      await this.rolePermissionRepo.delete({ roleId: id });
      if (dto.permissionIds.length) {
        const links = dto.permissionIds.map((pid) =>
          this.rolePermissionRepo.create({ roleId: id, permissionId: pid }),
        );
        await this.rolePermissionRepo.save(links);
      }
    }

    return this.toResponse(saved);
  }

  async delete(id: string): Promise<void> {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) throw new DomainException('Role not found', 'ROLE_NOT_FOUND');
    if (role.isSystem)
      throw new DomainException('Cannot delete system role', 'SYSTEM_ROLE');
    role.isDeleted = true;
    await this.roleRepo.save(role);
  }

  async list(params: {
    tenantId?: string;
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<{ data: RoleResponseDto[]; total: number }> {
    const page = params.page || 1;
    const limit = params.limit || 20;

    const qb = this.roleRepo.createQueryBuilder('r');
    qb.where('r.isDeleted = :isDeleted', { isDeleted: false });

    if (params.tenantId) {
      qb.andWhere('r.tenantId = :tenantId', { tenantId: params.tenantId });
    }
    if (params.search) {
      qb.andWhere(
        '(r.name LIKE :search OR r.code LIKE :search OR r.slug LIKE :search)',
        { search: `%${params.search}%` },
      );
    }
    if (params.isActive !== undefined) {
      qb.andWhere('r.isActive = :isActive', { isActive: params.isActive });
    }

    const [roles, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('r.createdAt', 'DESC')
      .getManyAndCount();

    const data = await Promise.all(roles.map((r) => this.toResponse(r)));
    return { data, total };
  }

  async findById(id: string): Promise<RoleResponseDto | null> {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) return null;
    return this.toResponse(role);
  }

  async assignRole(
    userId: string,
    roleId: string,
    assignedBy?: string,
    tenantId?: string,
  ): Promise<void> {
    const role = await this.roleRepo.findOne({ where: { id: roleId } });
    if (!role) throw new DomainException('Role not found', 'ROLE_NOT_FOUND');

    const existing = await this.userRoleRepo.findOne({
      where: { userId, roleId },
    });
    if (existing) return;

    await this.userRoleRepo.save(
      this.userRoleRepo.create({ userId, roleId, assignedBy, tenantId }),
    );
  }

  async unassignRole(userId: string, roleId: string): Promise<void> {
    await this.userRoleRepo.delete({ userId, roleId });
  }

  async getUserRoles(userId: string): Promise<RoleResponseDto[]> {
    const userRoles = await this.userRoleRepo.find({
      where: { userId },
      relations: { role: true },
    });
    return Promise.all(userRoles.map((ur) => this.toResponse(ur.role)));
  }

  async getRoleStats(): Promise<RoleStatsDto> {
    const total = await this.roleRepo.count({ where: { isDeleted: false } });
    const active = await this.roleRepo.count({
      where: { isDeleted: false, isActive: true },
    });
    const inactive = await this.roleRepo.count({
      where: { isDeleted: false, isActive: false },
    });

    const withPerms = await this.rolePermissionRepo
      .createQueryBuilder('rp')
      .select('DISTINCT rp.roleId', 'roleId')
      .getRawMany();

    return {
      total,
      active,
      inactive,
      withPermissions: withPerms.length,
    };
  }

  private async toResponse(role: Role): Promise<RoleResponseDto> {
    const links = await this.rolePermissionRepo.find({
      where: { roleId: role.id },
      select: { permissionId: true },
    });

    let permissions: { id: string; name: string; slug: string }[] = [];
    if (links.length) {
      const permIds = links.map((l) => l.permissionId);
      const perms = await this.permissionRepo.findBy({ id: In(permIds) });
      permissions = perms.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
      }));
    }

    const userCount = await this.userRoleRepo.count({
      where: { roleId: role.id },
    });

    return {
      id: role.id,
      name: role.name,
      code: role.code,
      slug: role.slug,
      description: role.description,
      isSystem: role.isSystem,
      isActive: role.isActive,
      tenantId: role.tenantId,
      permissions,
      userCount,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }
}
