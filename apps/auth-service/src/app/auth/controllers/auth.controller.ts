import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AuthService,
  CurrentUser,
  Public,
  LdapService,
  RsaDecryptionService,
  TotpService,
} from '@erp/auth';
import type { UserPayload } from '@erp/auth';
import {
  Tenant,
  Role,
  User,
  UserService,
  RoleService,
} from '@erp/identity-core';
import { MailService, MailQueueService } from '@erp/mail';
import type {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
} from '@erp/identity-core';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly roleService: RoleService,
    private readonly ldapService: LdapService,
    private readonly rsaService: RsaDecryptionService,
    private readonly totpService: TotpService,
    private readonly mailService: MailService,
    private readonly mailQueueService: MailQueueService,
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  @Get('rsa-key')
  @Public()
  async getRsaPublicKey() {
    if (!this.rsaService.isEnabled()) {
      return { enabled: false };
    }
    return {
      enabled: true,
      publicKey: this.rsaService.getPublicKey(),
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Public()
  async login(@Body() dto: LoginDto) {
    let user;
    let roles: string[] = [];

    let payloadDecrypted = false;

    // If payload is present, decrypt the full JSON blob and extract fields
    if (dto.payload && this.rsaService.isEnabled()) {
      try {
        const decrypted = this.rsaService.decrypt(dto.payload);
        const parsed = JSON.parse(decrypted);
        dto = { ...dto, ...parsed };
        payloadDecrypted = true;
      } catch {
        return {
          statusCode: 400,
          message: 'Invalid encrypted credentials payload',
        };
      }
    }

    // Decrypt the password using RSA Private Key if enabled
    // Skip when payload mode was used — the password inside the payload JSON is already plaintext
    let decryptedPassword = dto.password;
    if (this.rsaService.isEnabled() && !payloadDecrypted) {
      try {
        decryptedPassword = this.rsaService.decrypt(dto.password);
      } catch {
        return {
          statusCode: 400,
          message: 'Invalid encrypted credentials payload',
        };
      }
    }

    if (dto.provider === 'ldap') {
      // 1. Authenticate via LDAP/AD
      const ldapUser = await this.ldapService.authenticate(
        dto.email,
        decryptedPassword,
      );
      if (!ldapUser) {
        return { statusCode: 401, message: 'LDAP/AD authentication failed' };
      }

      // Defensive fallback for AD entries that may not have a mail attribute
      const ldapEmail = ldapUser.email || `${dto.email}@erp.local`;
      const ldapFirstName = ldapUser.firstName || dto.email;
      const ldapLastName = ldapUser.lastName || 'AD-User';

      // 2. Just-In-Time Provisioning
      user = await this.userService.findByEmail(ldapEmail);
      if (!user) {
        const tenant = await this.tenantRepo.findOne({
          where: { slug: 'system' },
        });
        const tenantId = tenant ? tenant.id : undefined;

        const newUserResponse = await this.userService.create({
          email: ldapEmail,
          password: `LDAP_SECRET_FALLBACK_${Date.now()}_${Math.random().toString(36).slice(-8)}`,
          firstName: ldapFirstName,
          lastName: ldapLastName,
          tenantId,
          isActive: true,
        });
        user = await this.userService.findById(newUserResponse.id);
      }

      // 3. Sync Roles from LDAP/AD groups
      if (user) {
        const mappedRoleCodes = this.ldapService.mapGroupsToRoles(
          ldapUser.groups,
        );
        const currentRoles = await this.roleService.getUserRoles(user.id);
        const currentRoleCodes = currentRoles.map((r) => r.code);

        for (const roleCode of mappedRoleCodes) {
          const roleRecord = await this.roleRepo.findOne({
            where: { code: roleCode },
          });
          if (roleRecord && !currentRoleCodes.includes(roleCode)) {
            await this.roleService.assignRole(
              user.id,
              roleRecord.id,
              undefined,
              user.tenantId,
            );
          }
        }

        roles = (await this.roleService.getUserRoles(user.id)).map(
          (r) => r.code,
        );
      }
    } else {
      // Local authentication flow
      user = await this.userService.findByEmail(dto.email);
      if (!user) return { statusCode: 401, message: 'Invalid credentials' };
      const valid = this.userService.verifyPassword(
        decryptedPassword,
        user.passwordHash,
      );
      if (!valid) return { statusCode: 401, message: 'Invalid credentials' };

      roles = (await this.roleService.getUserRoles(user.id)).map((r) => r.code);
    }

    if (!user) return { statusCode: 401, message: 'Authentication failed' };

    // Two-Factor Authentication Check
    if (user.isTwoFactorEnabled) {
      if (!user.twoFactorSecret) {
        throw new UnauthorizedException(
          'Two-factor secret is not configured for this user',
        );
      }

      const tempToken = await this.authService.generateTemp2faToken({
        userId: user.id,
        tenantId: user.tenantId || '',
      });

      // Calculate the current active 6-digit TOTP pin code and email it dynamically via Queue
      try {
        const mfaCode = this.totpService.generateCode(user.twoFactorSecret);
        await this.mailQueueService.queueMail(
          user.email,
          'Your ERP Verification Code',
          `<h3>Security Verification</h3>
           <p>Hello ${user.firstName},</p>
           <p>A sign-in request was made for your ERP Financials account.</p>
           <p>Please use the following 6-digit verification code to complete your login:</p>
           <div style="font-size: 24px; font-weight: bold; background: #f4f4f4; padding: 12px 20px; display: inline-block; letter-spacing: 2px; border-radius: 4px; font-family: monospace;">${mfaCode}</div>
           <p>This code is active for 5 minutes. If you did not make this request, please change your password immediately.</p>`,
        );
      } catch (mailErr) {
        // Fallback: log the error, do not fail login to allow setup and fallback verifications
        this.mailService['logger'].error(
          `Failed to background-queue login verification email: ${(mailErr as Error).message}`,
        );
      }

      return {
        requires2fa: true,
        tempToken,
        message:
          'Two-factor authentication (2FA) code is required to complete sign-in. A 6-digit verification code has been sent to your email.',
      };
    }

    const payload = { userId: user.id, tenantId: user.tenantId || '', roles };
    const accessToken = await this.authService.generateToken(payload);
    const refreshToken = await this.authService.generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      expiresIn: 28800,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
        tenantId: user.tenantId,
        companyId: user.companyId,
        branchId: user.branchId,
      },
    };
  }

  @Post('register')
  @Public()
  async register(@Body() dto: RegisterDto) {
    const user = await this.userService.create(dto);
    return { data: user };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Public()
  async refresh(@Body() dto: RefreshTokenDto) {
    try {
      const payload = await this.authService.verifyRefreshToken(
        dto.refreshToken,
      );
      const roles = await this.roleService
        .getUserRoles(payload.userId)
        .then((r) => r.map((r) => r.code));
      const newPayload = {
        userId: payload.userId,
        tenantId: payload.tenantId || '',
        roles,
      };
      const accessToken = await this.authService.generateToken(newPayload);
      const refreshToken =
        await this.authService.generateRefreshToken(newPayload);
      return { accessToken, refreshToken, expiresIn: 28800 };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  @Get('me')
  async me(@CurrentUser() currentUser: UserPayload) {
    const user = await this.userService.findById(currentUser.userId);
    if (!user) return { statusCode: 404, message: 'User not found' };
    return { data: user };
  }

  @Get('sso/login')
  @Public()
  async ssoLogin() {
    const enabled = process.env.SSO_ENABLED === 'true';
    if (!enabled) {
      return {
        statusCode: 400,
        message: 'SSO is disabled in platform configuration',
      };
    }

    return {
      issuerUrl: process.env.SSO_ISSUER_URL,
      clientId: process.env.SSO_CLIENT_ID,
      redirectUri: process.env.SSO_REDIRECT_URI,
      scope: process.env.SSO_SCOPE || 'openid email profile roles',
    };
  }

  @Post('sso/callback')
  @HttpCode(HttpStatus.OK)
  @Public()
  async ssoCallback(@Body() dto: { token: string }) {
    const enabled = process.env.SSO_ENABLED === 'true';
    if (!enabled) {
      return { statusCode: 400, message: 'SSO is disabled' };
    }

    try {
      // Decode JWT token payload (for simulation & token validation)
      const base64Url = dto.token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = Buffer.from(base64, 'base64').toString('ascii');
      const claims = JSON.parse(jsonPayload);

      const email = claims.email;
      const firstName = claims.given_name || claims.firstName || 'SSO';
      const lastName = claims.family_name || claims.lastName || 'User';
      const ssoRoles =
        claims.resource_access?.[process.env.SSO_CLIENT_ID || '']?.roles ||
        claims.roles ||
        [];

      if (!email) {
        throw new UnauthorizedException('Email claim missing in SSO token');
      }

      // Just-In-Time Provisioning
      let user = await this.userService.findByEmail(email);
      if (!user) {
        const tenant = await this.tenantRepo.findOne({
          where: { slug: 'system' },
        });
        const tenantId = tenant ? tenant.id : undefined;

        const newUserResponse = await this.userService.create({
          email,
          password: `SSO_SECRET_FALLBACK_${Date.now()}`,
          firstName,
          lastName,
          tenantId,
          isActive: true,
        });
        user = await this.userService.findById(newUserResponse.id);
      }

      // Sync Roles mapped from OIDC claims
      let roles: string[] = [];
      if (user) {
        const currentRoles = await this.roleService.getUserRoles(user.id);
        const currentRoleCodes = currentRoles.map((r) => r.code);

        for (const ssoRole of ssoRoles) {
          const roleCode = String(ssoRole).toUpperCase();
          const roleRecord = await this.roleRepo.findOne({
            where: { code: roleCode },
          });
          if (roleRecord && !currentRoleCodes.includes(roleCode)) {
            await this.roleService.assignRole(
              user.id,
              roleRecord.id,
              undefined,
              user.tenantId,
            );
          }
        }
        roles = (await this.roleService.getUserRoles(user.id)).map(
          (r) => r.code,
        );
      }

      if (!user) {
        throw new UnauthorizedException('Failed to provision SSO user');
      }

      const payload = {
        userId: user.id,
        tenantId: user.tenantId || '',
        roles,
      };
      const accessToken = await this.authService.generateToken(payload);
      const refreshToken = await this.authService.generateRefreshToken(payload);

      return {
        accessToken,
        refreshToken,
        expiresIn: 28800,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles,
          tenantId: user.tenantId,
        },
      };
    } catch (err) {
      throw new UnauthorizedException(
        `SSO token validation failed: ${(err as Error).message}`,
      );
    }
  }

  // ==========================================
  // Two-Factor Authentication (2FA) Endpoints
  // ==========================================

  @Get('2fa/generate')
  async generate2fa(@CurrentUser() currentUser: UserPayload) {
    const user = await this.userRepo.findOne({
      where: { id: currentUser.userId },
    });
    if (!user) throw new BadRequestException('User not found');
    if (user.isTwoFactorEnabled) {
      throw new BadRequestException(
        'Two-factor authentication is already enabled',
      );
    }

    const secret = this.totpService.generateSecret();
    const otpAuthUrl = this.totpService.getOtpauthUri(secret, user.email);

    // Email 2FA Setup details to user via Queue
    try {
      await this.mailQueueService.queueMail(
        user.email,
        'MFA Setup Details - ERP Financials',
        `<h3>Multi-Factor Authentication (MFA) Setup</h3>
         <p>Hello ${user.firstName},</p>
         <p>You requested to enable Two-Factor Authentication on your ERP account.</p>
         <p>Use your authenticator app (such as Google Authenticator, Microsoft Authenticator, or Authy) to scan the configuration QR code on your screen, or register manually using the following credentials:</p>
         <p><strong>MFA Secret Key:</strong><br/>
         <code style="font-size: 18px; font-weight: bold; background: #f4f4f4; padding: 6px 12px; display: inline-block; border-radius: 4px; border: 1px solid #ddd; margin: 4px 0;">${secret}</code></p>
         <p><strong>Config URL (for QR generators):</strong><br/>
         <code style="background: #f4f4f4; padding: 4px 8px; font-size: 13px; display: inline-block; word-break: break-all; border-radius: 4px;">${otpAuthUrl}</code></p>
         <p>Please enter the resulting 6-digit verification code from your authenticator app on the setup screen to complete setup.</p>`,
      );
    } catch (mailErr) {
      this.mailService['logger'].error(
        `Failed to background-queue 2FA setup email: ${(mailErr as Error).message}`,
      );
    }

    return {
      secret,
      otpAuthUrl,
    };
  }

  @Post('2fa/enable')
  @HttpCode(HttpStatus.OK)
  async enable2fa(
    @CurrentUser() currentUser: UserPayload,
    @Body() dto: { secret: string; code: string },
  ) {
    const user = await this.userRepo.findOne({
      where: { id: currentUser.userId },
    });
    if (!user) throw new BadRequestException('User not found');
    if (user.isTwoFactorEnabled) {
      throw new BadRequestException(
        'Two-factor authentication is already enabled',
      );
    }

    const isValid = this.totpService.verifyToken(dto.secret, dto.code);
    if (!isValid) {
      throw new BadRequestException('Invalid TOTP verification code');
    }

    user.isTwoFactorEnabled = true;
    user.twoFactorSecret = dto.secret;
    await this.userRepo.save(user);

    return {
      success: true,
      message: 'Two-factor authentication (2FA) enabled successfully',
    };
  }

  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  async disable2fa(
    @CurrentUser() currentUser: UserPayload,
    @Body() dto: { code: string },
  ) {
    const user = await this.userRepo.findOne({
      where: { id: currentUser.userId },
    });
    if (!user) throw new BadRequestException('User not found');
    if (!user.isTwoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is not active');
    }
    if (!user.twoFactorSecret) {
      throw new BadRequestException('Two-factor secret is not configured');
    }

    const isValid = this.totpService.verifyToken(
      user.twoFactorSecret,
      dto.code,
    );
    if (!isValid) {
      throw new BadRequestException('Invalid TOTP verification code');
    }

    user.isTwoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await this.userRepo.save(user);

    return {
      success: true,
      message: 'Two-factor authentication (2FA) disabled successfully',
    };
  }

  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  @Public()
  async verify2fa(@Body() dto: { tempToken: string; code: string }) {
    try {
      const payload = await this.authService.verifyTemp2faToken(dto.tempToken);
      if (!payload.is2faPending) {
        throw new UnauthorizedException('Invalid 2FA session');
      }

      const user = await this.userRepo.findOne({
        where: { id: payload.userId },
      });
      if (!user || !user.isTwoFactorEnabled) {
        throw new UnauthorizedException('User not found or 2FA is inactive');
      }
      if (!user.twoFactorSecret) {
        throw new UnauthorizedException('Two-factor secret is not configured');
      }

      const isValid = this.totpService.verifyToken(
        user.twoFactorSecret,
        dto.code,
      );
      if (!isValid) {
        throw new UnauthorizedException('Invalid 2FA verification code');
      }

      const roles = (await this.roleService.getUserRoles(user.id)).map(
        (r) => r.code,
      );
      const tokenPayload = {
        userId: user.id,
        tenantId: user.tenantId || '',
        roles,
      };

      const accessToken = await this.authService.generateToken(tokenPayload);
      const refreshToken =
        await this.authService.generateRefreshToken(tokenPayload);

      return {
        accessToken,
        refreshToken,
        expiresIn: 28800,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles,
          tenantId: user.tenantId,
          companyId: user.companyId,
          branchId: user.branchId,
        },
      };
    } catch (err) {
      throw new UnauthorizedException(
        `2FA authentication failed: ${(err as Error).message}`,
      );
    }
  }
}
