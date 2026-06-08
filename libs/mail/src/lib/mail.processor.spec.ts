import { MailProcessor } from './mail.processor';
import type { MailService } from './mail.service';
import type { Job } from 'bullmq';

describe('MailProcessor', () => {
  let sendMailMock: jest.Mock;
  let mailService: MailService;
  let processor: MailProcessor;

  beforeEach(() => {
    sendMailMock = jest.fn().mockResolvedValue(true);
    mailService = { sendMail: sendMailMock } as unknown as MailService;
    processor = new MailProcessor(mailService);
  });

  const makeJob = (name: string, data: Record<string, unknown>): Job =>
    ({ id: '1', name, data }) as unknown as Job;

  describe('process', () => {
    it('sends a single email for send-single-email jobs', async () => {
      await processor.process(
        makeJob('send-single-email', {
          to: 'user@erp.local',
          subject: 'Subject',
          html: '<p>Body</p>',
        }),
      );

      expect(sendMailMock).toHaveBeenCalledWith(
        'user@erp.local',
        'Subject',
        '<p>Body</p>',
      );
    });

    it('throws when a single email fails to send', async () => {
      sendMailMock.mockResolvedValue(false);

      await expect(
        processor.process(
          makeJob('send-single-email', {
            to: 'user@erp.local',
            subject: 'S',
            html: 'H',
          }),
        ),
      ).rejects.toThrow('SMTP sending failed for user@erp.local');
    });

    it('sends a bulk email for send-bulk-email jobs', async () => {
      await processor.process(
        makeJob('send-bulk-email', {
          to: 'user@erp.local',
          subject: 'S',
          html: 'H',
        }),
      );

      expect(sendMailMock).toHaveBeenCalledWith('user@erp.local', 'S', 'H');
    });

    it('does not throw if a bulk email fails to send', async () => {
      sendMailMock.mockResolvedValue(false);

      await expect(
        processor.process(
          makeJob('send-bulk-email', {
            to: 'user@erp.local',
            subject: 'S',
            html: 'H',
          }),
        ),
      ).resolves.toBeUndefined();
    });

    it('ignores unknown job names', async () => {
      await processor.process(makeJob('unknown-job', {}));
      expect(sendMailMock).not.toHaveBeenCalled();
    });
  });

  describe('worker event handlers', () => {
    it('handles the completed event without error', () => {
      expect(() =>
        processor.onCompleted(
          makeJob('send-single-email', { to: 'user@erp.local' }),
        ),
      ).not.toThrow();
    });

    it('handles the failed event without error', () => {
      expect(() =>
        processor.onFailed(
          makeJob('send-single-email', { to: 'user@erp.local' }),
          new Error('boom'),
        ),
      ).not.toThrow();
    });
  });
});
