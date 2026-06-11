import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.entity';
import { Role } from '../entities/role.entity';
import {
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
  UserStatsDto,
} from '../dto/user.dto';
import { DomainException } from '@erp/common';
import { UserStatus } from '@erp/enums';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  private hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  verifyPassword(password: string, stored: string): boolean {
    const [salt, hash] = stored.split(':');
    const computed = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(computed));
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new DomainException('Email already in use', 'EMAIL_EXISTS');
    }

    const user = this.userRepo.create({
      email: dto.email,
      passwordHash: this.hashPassword(dto.password),
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      avatar: dto.avatar,
      tenantId: dto.tenantId,
      companyId: dto.companyId,
      branchId: dto.branchId,
      isActive: dto.isActive ?? true,
      status: dto.status ?? UserStatus.ACTIVE,
    });

    const saved = await this.userRepo.save(user);

    if (dto.roleId) {
      const role = await this.roleRepo.findOne({ where: { id: dto.roleId } });
      if (role) {
        await this.userRoleRepo.save(
          this.userRoleRepo.create({
            userId: saved.id,
            roleId: role.id,
            tenantId: dto.tenantId,
          }),
        );
      }
    }

    return this.toResponse(saved);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new DomainException('User not found', 'USER_NOT_FOUND');

    Object.assign(user, dto);
    const saved = await this.userRepo.save(user);

    if (dto.roleId !== undefined) {
      await this.userRoleRepo.delete({ userId: id });
      if (dto.roleId) {
        const role = await this.roleRepo.findOne({ where: { id: dto.roleId } });
        if (role) {
          await this.userRoleRepo.save(
            this.userRoleRepo.create({ userId: id, roleId: role.id }),
          );
        }
      }
    }

    return this.toResponse(saved);
  }

  async delete(id: string, deletedBy?: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new DomainException('User not found', 'USER_NOT_FOUND');
    user.isDeleted = true;
    if (deletedBy) user.deletedBy = deletedBy;
    await this.userRepo.save(user);
  }

  async list(params: {
    tenantId?: string;
    page?: number;
    limit?: number;
    search?: string;
    status?: UserStatus;
  }): Promise<{ data: UserResponseDto[]; total: number }> {
    const page = params.page || 1;
    const limit = params.limit || 20;

    const qb = this.userRepo.createQueryBuilder('u');
    qb.where('u.isDeleted = :isDeleted', { isDeleted: false });

    if (params.tenantId) {
      qb.andWhere('u.tenantId = :tenantId', { tenantId: params.tenantId });
    }
    if (params.search) {
      qb.andWhere(
        '(u.firstName LIKE :search OR u.lastName LIKE :search OR u.email LIKE :search)',
        { search: `%${params.search}%` },
      );
    }
    if (params.status) {
      qb.andWhere('u.status = :status', { status: params.status });
    }

    const [users, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('u.createdAt', 'DESC')
      .getManyAndCount();

    const data = await Promise.all(users.map((u) => this.toResponse(u)));
    return { data, total };
  }

  private async toResponse(user: User): Promise<UserResponseDto> {
    const userRoles = await this.userRoleRepo.find({
      where: { userId: user.id },
      relations: { role: true },
    });

    const primaryRole = userRoles[0];

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatar: user.avatar,
      isActive: user.isActive,
      status: user.status,
      tenantId: user.tenantId,
      companyId: user.companyId,
      branchId: user.branchId,
      lastLoginAt: user.lastLoginAt,
      roleId: primaryRole?.role.id,
      role: primaryRole
        ? {
            id: primaryRole.role.id,
            name: primaryRole.role.name,
            code: primaryRole.role.code,
            slug: primaryRole.role.slug,
          }
        : undefined,
      roles: userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        code: ur.role.code,
        slug: ur.role.slug,
      })),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async activateUser(id: string, updatedBy?: string): Promise<UserResponseDto> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new DomainException('User not found', 'USER_NOT_FOUND');
    user.status = UserStatus.ACTIVE;
    user.isActive = true;
    if (updatedBy) user.updatedBy = updatedBy;
    const saved = await this.userRepo.save(user);
    return this.toResponse(saved);
  }

  async deactivateUser(
    id: string,
    updatedBy?: string,
  ): Promise<UserResponseDto> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new DomainException('User not found', 'USER_NOT_FOUND');
    user.status = UserStatus.INACTIVE;
    user.isActive = false;
    if (updatedBy) user.updatedBy = updatedBy;
    const saved = await this.userRepo.save(user);
    return this.toResponse(saved);
  }

  async suspendUser(id: string, updatedBy?: string): Promise<UserResponseDto> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new DomainException('User not found', 'USER_NOT_FOUND');
    user.status = UserStatus.SUSPENDED;
    user.isActive = false;
    if (updatedBy) user.updatedBy = updatedBy;
    const saved = await this.userRepo.save(user);
    return this.toResponse(saved);
  }

  async resetPassword(id: string, newPassword: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new DomainException('User not found', 'USER_NOT_FOUND');
    user.passwordHash = this.hashPassword(newPassword);
    await this.userRepo.save(user);
  }

  async getUserStats(): Promise<UserStatsDto> {
    const qb = this.userRepo.createQueryBuilder('u');
    const total = await qb
      .where('u.isDeleted = :isDeleted', { isDeleted: false })
      .getCount();
    const active = await qb
      .clone()
      .andWhere('u.status = :status', { status: UserStatus.ACTIVE })
      .getCount();
    const inactive = await qb
      .clone()
      .andWhere('u.status = :status', { status: UserStatus.INACTIVE })
      .getCount();
    const pending = await qb
      .clone()
      .andWhere('u.status = :status', { status: UserStatus.PENDING })
      .getCount();
    const suspended = await qb
      .clone()
      .andWhere('u.status = :status', { status: UserStatus.SUSPENDED })
      .getCount();

    const locked = await qb
      .clone()
      .andWhere('u.mustChangePwd = :mustChangePwd', { mustChangePwd: true })
      .getCount();

    return { total, active, inactive, pending, suspended, locked };
  }

  async approveUser(id: string, approvedBy?: string): Promise<UserResponseDto> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new DomainException('User not found', 'USER_NOT_FOUND');
    if (user.status !== UserStatus.PENDING) {
      throw new DomainException(
        'Only pending users can be approved',
        'INVALID_STATUS',
      );
    }
    user.status = UserStatus.ACTIVE;
    user.isActive = true;
    if (approvedBy) user.updatedBy = approvedBy;
    const saved = await this.userRepo.save(user);
    return this.toResponse(saved);
  }

  async rejectUser(id: string, rejectedBy?: string): Promise<UserResponseDto> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new DomainException('User not found', 'USER_NOT_FOUND');
    if (user.status !== UserStatus.PENDING) {
      throw new DomainException(
        'Only pending users can be rejected',
        'INVALID_STATUS',
      );
    }
    user.status = UserStatus.REJECTED;
    user.isActive = false;
    if (rejectedBy) user.updatedBy = rejectedBy;
    const saved = await this.userRepo.save(user);
    return this.toResponse(saved);
  }
}
