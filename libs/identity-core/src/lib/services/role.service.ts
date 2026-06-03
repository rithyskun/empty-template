import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { UserRole } from '../entities/user-role.entity';
import { CreateRoleDto, UpdateRoleDto, RoleResponseDto } from '../dto/role.dto';
import { DomainException } from '@erp/common';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
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
      description: dto.description,
      tenantId: dto.tenantId,
      isSystem: dto.isSystem ?? false,
    });
    const saved = await this.roleRepo.save(role);

    if (dto.permissions?.length) {
      await this.permissionRepo.save(
        dto.permissions.map((p) =>
          this.permissionRepo.create({
            roleId: saved.id,
            resource: p.resource,
            action: p.action,
            tenantId: dto.tenantId,
          }),
        ),
      );
    }

    return this.toResponse(saved);
  }

  async update(id: string, dto: UpdateRoleDto): Promise<RoleResponseDto> {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) throw new DomainException('Role not found', 'ROLE_NOT_FOUND');
    Object.assign(role, dto);
    const saved = await this.roleRepo.save(role);
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
  }): Promise<{ data: RoleResponseDto[]; total: number }> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const where: Record<string, unknown> = { isDeleted: false };
    if (params.tenantId) where['tenantId'] = params.tenantId;

    const [roles, total] = await this.roleRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

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
    return userRoles.map((ur) => ({
      id: ur.role.id,
      name: ur.role.name,
      code: ur.role.code,
      description: ur.role.description,
      isSystem: ur.role.isSystem,
      tenantId: ur.role.tenantId,
      permissions: [],
      createdAt: ur.role.createdAt,
      updatedAt: ur.role.updatedAt,
    }));
  }

  private async toResponse(role: Role): Promise<RoleResponseDto> {
    const permissions = await this.permissionRepo.find({
      where: { roleId: role.id },
    });

    return {
      id: role.id,
      name: role.name,
      code: role.code,
      description: role.description,
      isSystem: role.isSystem,
      tenantId: role.tenantId,
      permissions: permissions.map((p) => ({
        resource: p.resource,
        action: p.action,
      })),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }
}
