import { TotpService } from './totp.service';

describe('TotpService', () => {
  let service: TotpService;

  beforeEach(() => {
    service = new TotpService();
  });

  describe('generateSecret', () => {
    it('generates a Base32 secret of the requested length', () => {
      const secret = service.generateSecret();
      expect(secret).toHaveLength(32);
    });

    it('honours a custom length', () => {
      const secret = service.generateSecret(16);
      expect(secret).toHaveLength(16);
    });

    it('only contains RFC 4648 Base32 alphabet characters', () => {
      const secret = service.generateSecret();
      expect(secret).toMatch(/^[A-Z2-7]+$/);
    });

    it('produces a different secret on each call', () => {
      const a = service.generateSecret();
      const b = service.generateSecret();
      expect(a).not.toEqual(b);
    });
  });

  describe('getOtpauthUri', () => {
    it('builds a spec-compliant otpauth URI with encoded issuer and email', () => {
      const uri = service.getOtpauthUri('JBSWY3DPEHPK3PXP', 'user@erp.local');
      expect(uri).toContain('otpauth://totp/');
      expect(uri).toContain('secret=JBSWY3DPEHPK3PXP');
      expect(uri).toContain('issuer=ERP%20Financials');
      expect(uri).toContain('user%40erp.local');
      expect(uri).toContain('algorithm=SHA1');
      expect(uri).toContain('digits=6');
      expect(uri).toContain('period=30');
    });

    it('uses a custom issuer when provided', () => {
      const uri = service.getOtpauthUri('SECRET', 'a@b.com', 'My Co');
      expect(uri).toContain('issuer=My%20Co');
    });
  });

  describe('generateCode / verifyToken', () => {
    it('generates a 6-digit numeric code', () => {
      const secret = service.generateSecret();
      const code = service.generateCode(secret);
      expect(code).toMatch(/^\d{6}$/);
    });

    it('verifies a freshly generated code', () => {
      const secret = service.generateSecret();
      const code = service.generateCode(secret);
      expect(service.verifyToken(secret, code)).toBe(true);
    });

    it('rejects an incorrect code', () => {
      const secret = service.generateSecret();
      const code = service.generateCode(secret);
      const wrong = code === '000000' ? '111111' : '000000';
      expect(service.verifyToken(secret, wrong)).toBe(false);
    });

    it('rejects malformed codes', () => {
      const secret = service.generateSecret();
      expect(service.verifyToken(secret, '')).toBe(false);
      expect(service.verifyToken(secret, '12345')).toBe(false);
      expect(service.verifyToken(secret, 'abcdef')).toBe(false);
    });

    it('accepts a code from the previous time step within the drift window', () => {
      const secret = service.generateSecret();
      const realNow = Date.now();
      const nowSpy = jest.spyOn(Date, 'now');

      // Generate a code "30 seconds ago"
      nowSpy.mockReturnValue(realNow - 30_000);
      const previousCode = service.generateCode(secret);

      // Verify "now" - should still pass with default ±1 step tolerance
      nowSpy.mockReturnValue(realNow);
      expect(service.verifyToken(secret, previousCode)).toBe(true);

      nowSpy.mockRestore();
    });

    it('rejects a code outside the drift window', () => {
      const secret = service.generateSecret();
      const realNow = Date.now();
      const nowSpy = jest.spyOn(Date, 'now');

      // Generate a code from ~5 minutes ago
      nowSpy.mockReturnValue(realNow - 300_000);
      const staleCode = service.generateCode(secret);

      nowSpy.mockReturnValue(realNow);
      expect(service.verifyToken(secret, staleCode)).toBe(false);

      nowSpy.mockRestore();
    });

    it('matches a known RFC 6238 test vector', () => {
      // RFC 6238 Appendix B: secret "12345678901234567890" (ASCII) is
      // Base32 "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ". At T = 59s the SHA-1
      // TOTP value is 94287082 -> last 6 digits "287082".
      const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(59_000);
      expect(service.generateCode(secret)).toBe('287082');
      nowSpy.mockRestore();
    });
  });
});
