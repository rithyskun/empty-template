import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class RsaDecryptionService implements OnModuleInit {
  private readonly logger = new Logger(RsaDecryptionService.name);

  private privateKey: string;
  private publicKey: string;
  private enabled: boolean;

  constructor() {
    this.enabled = process.env.RSA_DECRYPTION_ENABLED === 'true';
    this.privateKey = process.env.RSA_PRIVATE_KEY || '';
  }

  onModuleInit() {
    if (!this.enabled) {
      this.logger.log('RSA payload decryption is disabled.');
      return;
    }

    if (this.privateKey) {
      this.logger.log('Loaded RSA Private Key from environmental variables.');
      try {
        // Derive public key from the private key for verification
        const keyObject = crypto.createPrivateKey(this.privateKey);
        this.publicKey = crypto.createPublicKey(keyObject).export({
          type: 'spki',
          format: 'pem',
        }) as string;
      } catch (err) {
        this.logger.error(
          `Failed to derive RSA Public Key from provided Private Key: ${(err as Error).message}`,
        );
      }
    } else {
      this.logger.warn(
        'RSA_DECRYPTION_ENABLED is true, but RSA_PRIVATE_KEY is missing. Generating a secure ephemeral 2048-bit RSA Keypair for development/testing...',
      );
      try {
        const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
          modulusLength: 2048,
          publicKeyEncoding: {
            type: 'spki',
            format: 'pem',
          },
          privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
          },
        });
        this.privateKey = privateKey;
        this.publicKey = publicKey;

        this.logger.log('\n=========================================');
        this.logger.log('EPHEMERAL RSA PUBLIC KEY FOR FRONTEND ENCRYPTION:');
        this.logger.log(`\n${this.publicKey}`);
        this.logger.log('=========================================\n');
      } catch (err) {
        this.logger.error(
          `Failed to generate ephemeral RSA keypair: ${(err as Error).message}`,
        );
      }
    }
  }

  /**
   * Decrypts a base64-encoded encrypted string using the RSA private key
   */
  decrypt(encryptedData: string): string {
    if (!this.enabled) {
      return encryptedData;
    }

    try {
      this.logger.debug(
        'Attempting RSA private-key decryption of login payload',
      );
      const buffer = Buffer.from(encryptedData, 'base64');
      const decrypted = crypto.privateDecrypt(
        {
          key: this.privateKey,
          padding: crypto.constants.RSA_PKCS1_PADDING, // Standard PKCS#1 padding (widely used in frontend JSEncrypt)
        },
        buffer,
      );
      return decrypted.toString('utf8');
    } catch (err) {
      this.logger.error(
        `RSA decryption failed. Ensure the frontend is encrypting with the matching public key using standard PKCS#1 padding. Error: ${(err as Error).message}`,
      );
      throw new Error('Failed to decrypt password payload', { cause: err });
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getPublicKey(): string {
    return this.publicKey;
  }
}
