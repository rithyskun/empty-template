import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity';
import { Company } from './entities/company.entity';
import { Branch } from './entities/branch.entity';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { UserRole } from './entities/user-role.entity';
import { UserService } from './services/user.service';
import { RoleService } from './services/role.service';
import { LdapService } from './services/ldap.service';
import { RsaDecryptionService } from './services/rsa-decryption.service';
import { TotpService } from './services/totp.service';
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
      UserRole,
    ]),
    MailModule,
  ],
  providers: [
    UserService,
    RoleService,
    LdapService,
    RsaDecryptionService,
    TotpService,
  ],
  exports: [
    UserService,
    RoleService,
    LdapService,
    RsaDecryptionService,
    TotpService,
    MailModule,
    TypeOrmModule,
  ],
})
export class IdentityCoreModule {}
