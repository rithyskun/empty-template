import { MailQueueService } from './mail-queue.service';
import type { Queue } from 'bullmq';

describe('MailQueueService', () => {
  let addMock: jest.Mock;
  let addBulkMock: jest.Mock;
  let queue: Queue;
  let service: MailQueueService;

  beforeEach(() => {
    addMock = jest.fn().mockResolvedValue(undefined);
    addBulkMock = jest.fn().mockResolvedValue(undefined);
    queue = { add: addMock, addBulk: addBulkMock } as unknown as Queue;
    service = new MailQueueService(queue);
  });

  describe('queueMail', () => {
    it('enqueues a single email job and returns true', async () => {
      const result = await service.queueMail(
        'user@erp.local',
        'Subject',
        '<p>Body</p>',
      );

      expect(result).toBe(true);
      expect(addMock).toHaveBeenCalledWith('send-single-email', {
        to: 'user@erp.local',
        subject: 'Subject',
        html: '<p>Body</p>',
      });
    });

    it('returns false when the queue rejects', async () => {
      addMock.mockRejectedValue(new Error('redis unavailable'));

      const result = await service.queueMail('user@erp.local', 'S', 'H');

      expect(result).toBe(false);
    });
  });

  describe('queueBulkMails', () => {
    it('maps jobs to the bulk format and enqueues them', async () => {
      const jobs = [
        { to: 'a@erp.local', subject: 'A', html: '<p>A</p>' },
        { to: 'b@erp.local', subject: 'B', html: '<p>B</p>' },
      ];

      await service.queueBulkMails(jobs);

      expect(addBulkMock).toHaveBeenCalledWith([
        { name: 'send-bulk-email', data: jobs[0] },
        { name: 'send-bulk-email', data: jobs[1] },
      ]);
    });

    it('swallows errors from the queue (does not throw)', async () => {
      addBulkMock.mockRejectedValue(new Error('redis unavailable'));

      await expect(
        service.queueBulkMails([
          { to: 'a@erp.local', subject: 'A', html: '<p>A</p>' },
        ]),
      ).resolves.toBeUndefined();
    });
  });
});
