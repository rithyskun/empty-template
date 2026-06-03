import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as crypto from 'crypto';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.entity';
import { Role } from '../entities/role.entity';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from '../dto/user.dto';
import { DomainException } from '@erp/common';

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
      tenantId: dto.tenantId,
      companyId: dto.companyId,
      branchId: dto.branchId,
      isActive: dto.isActive ?? true,
    });

    const saved = await this.userRepo.save(user);

    if (dto.roleIds?.length) {
      const roles = await this.roleRepo.findBy({ id: In(dto.roleIds) });
      await this.userRoleRepo.save(
        roles.map((r: Role) =>
          this.userRoleRepo.create({
            userId: saved.id,
            roleId: r.id,
            tenantId: dto.tenantId,
          }),
        ),
      );
    }

    return this.toResponse(saved);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new DomainException('User not found', 'USER_NOT_FOUND');

    Object.assign(user, dto);
    const saved = await this.userRepo.save(user);
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
  }): Promise<{ data: UserResponseDto[]; total: number }> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const where: Record<string, unknown> = { isDeleted: false };
    if (params.tenantId) where['tenantId'] = params.tenantId;

    const [users, total] = await this.userRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const data = await Promise.all(users.map((u) => this.toResponse(u)));
    return { data, total };
  }

  private async toResponse(user: User): Promise<UserResponseDto> {
    const userRoles = await this.userRoleRepo.find({
      where: { userId: user.id },
      relations: { role: true },
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      isActive: user.isActive,
      tenantId: user.tenantId,
      companyId: user.companyId,
      branchId: user.branchId,
      lastLoginAt: user.lastLoginAt,
      roles: userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        code: ur.role.code,
      })),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
