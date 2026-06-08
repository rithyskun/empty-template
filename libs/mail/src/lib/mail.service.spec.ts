const createTransportMock = jest.fn();

jest.mock('nodemailer', () => ({
  createTransport: (...args: unknown[]) => createTransportMock(...args),
}));

import { MailService } from './mail.service';

describe('MailService', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_SECURE;
    delete process.env.SMTP_FROM;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  describe('simulation mode (incomplete SMTP config)', () => {
    it('does not create a transporter', () => {
      new MailService();
      expect(createTransportMock).not.toHaveBeenCalled();
    });

    it('returns true without sending when simulating', async () => {
      const service = new MailService();
      const result = await service.sendMail(
        'user@erp.local',
        'Hello',
        '<p>Body</p>',
      );
      expect(result).toBe(true);
    });
  });

  describe('SMTP mode (complete config)', () => {
    let sendMailMock: jest.Mock;

    beforeEach(() => {
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_USER = 'user';
      process.env.SMTP_PASS = 'pass';
      sendMailMock = jest.fn().mockResolvedValue({ messageId: 'abc' });
      createTransportMock.mockReturnValue({ sendMail: sendMailMock });
    });

    it('creates a transporter with the configured host and port', () => {
      process.env.SMTP_PORT = '2525';
      process.env.SMTP_SECURE = 'true';
      new MailService();
      expect(createTransportMock).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'smtp.example.com',
          port: 2525,
          secure: true,
          auth: { user: 'user', pass: 'pass' },
        }),
      );
    });

    it('defaults the port to 587 when SMTP_PORT is unset', () => {
      new MailService();
      expect(createTransportMock).toHaveBeenCalledWith(
        expect.objectContaining({ port: 587 }),
      );
    });

    it('sends mail and returns true on success', async () => {
      const service = new MailService();
      const result = await service.sendMail(
        'to@erp.local',
        'Subject',
        '<b>Hi</b>',
      );
      expect(result).toBe(true);
      expect(sendMailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'to@erp.local',
          subject: 'Subject',
          html: '<b>Hi</b>',
        }),
      );
    });

    it('uses the configured from address', async () => {
      process.env.SMTP_FROM = '"Finance" <finance@erp.local>';
      const service = new MailService();
      await service.sendMail('to@erp.local', 'S', 'H');
      expect(sendMailMock).toHaveBeenCalledWith(
        expect.objectContaining({ from: '"Finance" <finance@erp.local>' }),
      );
    });

    it('returns false when the transport throws', async () => {
      sendMailMock.mockRejectedValue(new Error('SMTP down'));
      const service = new MailService();
      const result = await service.sendMail('to@erp.local', 'S', 'H');
      expect(result).toBe(false);
    });
  });
});
