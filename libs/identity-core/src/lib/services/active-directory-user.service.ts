import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActiveDirectoryUser } from '../entities/active-directory-user.entity';

@Injectable()
export class ActiveDirectoryUserService {
  constructor(
    @InjectRepository(ActiveDirectoryUser)
    private readonly adUserRepo: Repository<ActiveDirectoryUser>,
  ) {}

  async recordFirstSeen(params: {
    userId: string;
    adObjectId?: string;
    dn: string;
    sAMAccountName: string;
    domain: string;
    adAttributes?: Record<string, unknown>;
  }): Promise<ActiveDirectoryUser> {
    const now = new Date();

    const existing = await this.adUserRepo.findOne({
      where: { userId: params.userId },
    });

    if (existing) {
      existing.lastSyncedAt = now;
      if (params.adAttributes) {
        existing.adAttributes = {
          ...existing.adAttributes,
          ...params.adAttributes,
        };
      }
      return this.adUserRepo.save(existing);
    }

    const entity = this.adUserRepo.create({
      userId: params.userId,
      adObjectId: params.adObjectId,
      dn: params.dn,
      sAMAccountName: params.sAMAccountName,
      domain: params.domain,
      firstSeenAt: now,
      lastSyncedAt: now,
      adAttributes: params.adAttributes,
    });

    return this.adUserRepo.save(entity);
  }

  async findByUserId(userId: string): Promise<ActiveDirectoryUser | null> {
    return this.adUserRepo.findOne({ where: { userId } });
  }
}
