import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity';
import { Company } from './entities/company.entity';
import { Branch } from './entities/branch.entity';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { UserRole } from './entities/user-role.entity';
import { ActiveDirectoryUser } from './entities/active-directory-user.entity';
import { UserService } from './services/user.service';
import { RoleService } from './services/role.service';
import { PermissionService } from './services/permission.service';
import { ActiveDirectoryUserService } from './services/active-directory-user.service';
import { SeedService } from './services/seed.service';
import { MailModule } from '@erp/mail';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tenant,
      Company,
      Branch,
      User,
      Role,
      Permission,
      RolePermission,
      UserRole,
      ActiveDirectoryUser,
    ]),
    MailModule,
  ],
  providers: [
    UserService,
    RoleService,
    PermissionService,
    ActiveDirectoryUserService,
    SeedService,
  ],
  exports: [
    UserService,
    RoleService,
    PermissionService,
    ActiveDirectoryUserService,
    SeedService,
    MailModule,
    TypeOrmModule,
  ],
})
export class IdentityCoreModule {}
