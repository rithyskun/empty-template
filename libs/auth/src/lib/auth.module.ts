import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { LdapService } from './services/ldap.service';
import { RsaDecryptionService } from './services/rsa-decryption.service';
import { TotpService } from './services/totp.service';

@Global()
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: (): Record<string, unknown> => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '8h' },
      }),
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    LdapService,
    RsaDecryptionService,
    TotpService,
  ],
  exports: [
    AuthService,
    JwtModule,
    PassportModule,
    LdapService,
    RsaDecryptionService,
    TotpService,
  ],
})
export class AuthModule {}
