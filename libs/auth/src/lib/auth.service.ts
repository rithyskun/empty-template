import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async generateToken(payload: {
    userId: string;
    tenantId: string;
    roles: string[];
    permissions?: string[];
  }): Promise<string> {
    return this.jwtService.signAsync(payload);
  }

  async generateRefreshToken(payload: {
    userId: string;
    tenantId: string;
    roles: string[];
    permissions?: string[];
  }): Promise<string> {
    const expiresInMs = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    const numeric = parseInt(expiresInMs, 10);
    const expiresIn: number =
      String(numeric) === expiresInMs ? numeric : 604800;
    return this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      expiresIn,
    });
  }

  async verifyRefreshToken(token: string): Promise<{
    userId: string;
    tenantId: string;
    roles: string[];
    permissions?: string[];
  }> {
    return this.jwtService.verifyAsync(token, {
      secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    });
  }

  async verifyToken(token: string): Promise<Record<string, unknown>> {
    return this.jwtService.verifyAsync(token);
  }

  async generateTemp2faToken(payload: {
    userId: string;
    tenantId: string;
  }): Promise<string> {
    return this.jwtService.signAsync(
      { ...payload, is2faPending: true },
      { expiresIn: '5m' },
    );
  }

  async verifyTemp2faToken(
    token: string,
  ): Promise<{ userId: string; tenantId: string; is2faPending: boolean }> {
    return this.jwtService.verifyAsync(token);
  }
}
