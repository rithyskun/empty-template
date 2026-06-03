import { Injectable } from '@nestjs/common';
import { PaymentProvider } from './provider.interface';

@Injectable()
export class PaymentProviderRegistry {
  private readonly providers = new Map<string, PaymentProvider>();

  register(provider: PaymentProvider): void {
    this.providers.set(provider.providerCode, provider);
  }

  resolve(code: string): PaymentProvider {
    const p = this.providers.get(code);
    if (!p) throw new Error(`Unknown payment provider: ${code}`);
    return p;
  }
}
