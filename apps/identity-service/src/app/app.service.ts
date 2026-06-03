import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Tenant,
  Role,
  Permission,
  UserService,
  RoleService,
} from '@erp/identity-core';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
    private readonly userService: UserService,
    private readonly roleService: RoleService,
  ) {}

  getData(): { message: string } {
    return { message: 'Identity Service is running' };
  }

  async seed(): Promise<Record<string, any>> {
    this.logger.log('Starting DB bootstrap seed...');

    // 1. Seed Tenant
    let tenant = await this.tenantRepo.findOne({ where: { slug: 'system' } });
    if (!tenant) {
      tenant = this.tenantRepo.create({
        name: 'System Tenant',
        slug: 'system',
        domain: 'system.erp.local',
        isActive: true,
        settings: {},
      });
      tenant = await this.tenantRepo.save(tenant);
      this.logger.log('Created System Tenant');
    }

    // 2. Seed Roles
    const rolesToSeed = [
      {
        code: 'SUPER_ADMIN',
        name: 'Super Administrator',
        description: 'Complete system access',
      },
      {
        code: 'ADMIN',
        name: 'Administrator',
        description: 'Tenant level administrator access',
      },
      {
        code: 'USER',
        name: 'Standard User',
        description: 'Regular staff user access',
      },
    ];

    const seededRoles: Record<string, Role> = {};
    for (const r of rolesToSeed) {
      let role = await this.roleRepo.findOne({ where: { code: r.code } });
      if (!role) {
        role = this.roleRepo.create({
          code: r.code,
          name: r.name,
          description: r.description,
          isSystem: true,
          tenantId: tenant.id,
        });
        role = await this.roleRepo.save(role);
        this.logger.log(`Created system role: ${r.code}`);
      }
      seededRoles[r.code] = role;
    }

    // 3. Seed Permissions for SUPER_ADMIN
    const superAdminRole = seededRoles['SUPER_ADMIN'];
    const existingPerm = await this.permissionRepo.findOne({
      where: { roleId: superAdminRole.id, resource: 'all', action: 'all' },
    });
    if (!existingPerm) {
      const perm = this.permissionRepo.create({
        roleId: superAdminRole.id,
        resource: 'all',
        action: 'all',
        tenantId: tenant.id,
      });
      await this.permissionRepo.save(perm);
      this.logger.log('Granted all permissions to SUPER_ADMIN');
    }

    // 4. Seed Admin User
    const adminEmail = 'admin@erp.local';
    let adminUser = await this.userService.findByEmail(adminEmail);
    if (!adminUser) {
      const userResponse = await this.userService.create({
        email: adminEmail,
        password: 'password123',
        firstName: 'System',
        lastName: 'Admin',
        phone: '123456789',
        tenantId: tenant.id,
        isActive: true,
      });
      adminUser = await this.userService.findById(userResponse.id);
      this.logger.log(
        'Created default Super Admin user (admin@erp.local / password123)',
      );
    }

    // 5. Assign Role to User
    if (adminUser) {
      await this.roleService.assignRole(
        adminUser.id,
        superAdminRole.id,
        undefined,
        tenant.id,
      );
      this.logger.log('Assigned SUPER_ADMIN role to default admin user');
    }

    return {
      success: true,
      message: 'Seeding completed successfully',
      tenant: { id: tenant.id, slug: tenant.slug },
      roles: Object.keys(seededRoles),
      adminUser: { id: adminUser?.id, email: adminUser?.email },
    };
  }
}
