import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class TotpService {
  private readonly logger = new Logger(TotpService.name);

  // Alphabet for Base32 encoding/decoding (RFC 4648)
  private readonly BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

  /**
   * Generates a random Base32 encoded TOTP Secret (160 bits / 20 bytes)
   */
  generateSecret(length = 32): string {
    const randomBytes = crypto.randomBytes(Math.ceil((length * 5) / 8));
    let secret = '';
    let binString = '';

    for (let i = 0; i < randomBytes.length; i++) {
      binString += randomBytes[i].toString(2).padStart(8, '0');
    }

    for (let i = 0; i < length; i++) {
      const chunk = binString.substr(i * 5, 5).padEnd(5, '0');
      const val = parseInt(chunk, 2);
      secret += this.BASE32_ALPHABET[val];
    }

    return secret;
  }

  /**
   * Generates a standard optauth URI that can be rendered as a QR Code (e.g., in a frontend app)
   */
  getOtpauthUri(
    secret: string,
    email: string,
    issuer = 'ERP Financials',
  ): string {
    const encodedIssuer = encodeURIComponent(issuer);
    const encodedEmail = encodeURIComponent(email);
    return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
  }

  /**
   * Generates the current active 6-digit TOTP code for a Base32 secret
   */
  generateCode(secret: string): string {
    const decodedSecret = this.base32Decode(secret);
    const currentTimeSteps = Math.floor(Date.now() / 1000 / 30);
    return this.generateTotpCode(decodedSecret, currentTimeSteps);
  }

  /**
   * Verifies a 6-digit TOTP code against a Base32 encoded secret.
   * Includes a time-drift tolerance of ±1 step (±30 seconds) by default.
   */
  verifyToken(secret: string, code: string, window = 1): boolean {
    if (!code || code.length !== 6 || isNaN(Number(code))) {
      return false;
    }

    try {
      const decodedSecret = this.base32Decode(secret);
      const currentTimeSteps = Math.floor(Date.now() / 1000 / 30);

      // Check current time step and adjacent steps (for clock drift tolerance)
      for (let i = -window; i <= window; i++) {
        const calculatedCode = this.generateTotpCode(
          decodedSecret,
          currentTimeSteps + i,
        );
        if (calculatedCode === code) {
          return true;
        }
      }
    } catch (err) {
      this.logger.error(
        `Error verifying TOTP token: ${(err as Error).message}`,
      );
    }

    return false;
  }

  /**
   * Generates a TOTP code for a specific time step and binary secret
   */
  private generateTotpCode(secretBuffer: Buffer, timeStep: number): string {
    // 1. Create 8-byte buffer representing the counter (64-bit integer)
    const counterBuffer = Buffer.alloc(8);
    let tempCounter = timeStep;
    for (let i = 7; i >= 0; i--) {
      counterBuffer[i] = tempCounter & 0xff;
      tempCounter = tempCounter >> 8;
    }

    // 2. Perform HMAC-SHA1 using the secret and the counter
    const hmac = crypto.createHmac('sha1', secretBuffer);
    hmac.update(counterBuffer);
    const hmacResult = hmac.digest();

    // 3. Dynamic Truncation: select 4 bytes dynamically from HMAC output
    const offset = hmacResult[hmacResult.length - 1] & 0xf;
    const binary =
      ((hmacResult[offset] & 0x7f) << 24) |
      ((hmacResult[offset + 1] & 0xff) << 16) |
      ((hmacResult[offset + 2] & 0xff) << 8) |
      (hmacResult[offset + 3] & 0xff);

    // 4. Generate 6-digit PIN code
    const otp = binary % 1000000;
    return otp.toString().padStart(6, '0');
  }

  /**
   * Decodes a RFC 4648 Base32 encoded string into a raw binary Buffer
   */
  private base32Decode(base32String: string): Buffer {
    const cleanString = base32String.toUpperCase().replace(/=/g, '');
    let binString = '';

    for (let i = 0; i < cleanString.length; i++) {
      const val = this.BASE32_ALPHABET.indexOf(cleanString[i]);
      if (val === -1) {
        throw new Error('Invalid Base32 character encountered');
      }
      binString += val.toString(2).padStart(5, '0');
    }

    const byteCount = Math.floor(binString.length / 8);
    const bytes = Buffer.alloc(byteCount);

    for (let i = 0; i < byteCount; i++) {
      bytes[i] = parseInt(binString.substr(i * 8, 8), 2);
    }

    return bytes;
  }
}
