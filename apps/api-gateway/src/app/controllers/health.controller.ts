import { Controller, Get } from '@nestjs/common';
import { ALL_ROUTES } from '@erp/constants';
import * as net from 'net';

interface HealthStatus {
  status: 'ok' | 'degraded';
  timestamp: string;
  services: Record<string, 'up' | 'down'>;
}

@Controller('health')
export class HealthController {
  @Get()
  async health(): Promise<HealthStatus> {
    const services: Record<string, 'up' | 'down'> = {};
    let allUp = true;

    for (const route of ALL_ROUTES) {
      const target = process.env[route.targetEnv] || route.defaultHost;
      const isUp = await this.checkTcp(target);
      services[route.targetEnv] = isUp ? 'up' : 'down';
      if (!isUp) allUp = false;
    }

    return {
      status: allUp ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services,
    };
  }

  private checkTcp(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const parsed = new URL(url);
        const socket = new net.Socket();
        const timeout = 2000;

        socket.setTimeout(timeout);
        socket.once('connect', () => {
          socket.destroy();
          resolve(true);
        });
        socket.once('error', () => {
          socket.destroy();
          resolve(false);
        });
        socket.once('timeout', () => {
          socket.destroy();
          resolve(false);
        });
        socket.connect(Number(parsed.port) || 80, parsed.hostname);
      } catch {
        resolve(false);
      }
    });
  }
}
