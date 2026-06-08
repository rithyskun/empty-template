import * as crypto from 'crypto';
import { RsaDecryptionService } from './rsa-decryption.service';

describe('RsaDecryptionService', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  describe('when disabled', () => {
    beforeEach(() => {
      process.env.RSA_DECRYPTION_ENABLED = 'false';
    });

    it('reports as disabled', () => {
      const service = new RsaDecryptionService();
      expect(service.isEnabled()).toBe(false);
    });

    it('returns the payload unchanged from decrypt()', () => {
      const service = new RsaDecryptionService();
      service.onModuleInit();
      expect(service.decrypt('untouched-payload')).toBe('untouched-payload');
    });

    it('does not generate a public key', () => {
      const service = new RsaDecryptionService();
      service.onModuleInit();
      expect(service.getPublicKey()).toBe('');
    });
  });

  describe('when enabled with an ephemeral keypair', () => {
    let service: RsaDecryptionService;

    beforeEach(() => {
      process.env.RSA_DECRYPTION_ENABLED = 'true';
      delete process.env.RSA_PRIVATE_KEY;
      service = new RsaDecryptionService();
      service.onModuleInit();
    });

    it('reports as enabled', () => {
      expect(service.isEnabled()).toBe(true);
    });

    it('exposes a PEM public key', () => {
      const publicKey = service.getPublicKey();
      expect(publicKey).toContain('BEGIN PUBLIC KEY');
    });

    it('round-trips data encrypted with the public key', () => {
      const plaintext = 'super-secret-password';
      const encrypted = crypto
        .publicEncrypt(
          {
            key: service.getPublicKey(),
            padding: crypto.constants.RSA_PKCS1_PADDING,
          },
          Buffer.from(plaintext, 'utf8'),
        )
        .toString('base64');

      expect(service.decrypt(encrypted)).toBe(plaintext);
    });

    it('throws when given a ciphertext larger than the key modulus', () => {
      // 384 bytes exceeds the 2048-bit (256-byte) modulus, so OpenSSL rejects
      // it outright ("data too large for key size") rather than applying the
      // implicit-rejection path used for padding failures.
      const oversizedCiphertext = crypto.randomBytes(384).toString('base64');

      expect(() => service.decrypt(oversizedCiphertext)).toThrow(
        'Failed to decrypt password payload',
      );
    });
  });

  describe('when enabled with a provided private key', () => {
    it('derives the public key from the supplied private key', () => {
      const { privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });

      process.env.RSA_DECRYPTION_ENABLED = 'true';
      process.env.RSA_PRIVATE_KEY = privateKey;

      const service = new RsaDecryptionService();
      service.onModuleInit();

      expect(service.getPublicKey()).toContain('BEGIN PUBLIC KEY');
    });
  });
});
