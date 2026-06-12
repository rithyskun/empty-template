import { AdvanceCoreService } from '../advance-core.service';
import { AdvanceRequest } from '../entities/advance-request.entity';
import { AdvanceRepayment } from '../entities/advance-repayment.entity';

type RepoMock = {
  create: jest.Mock;
  save: jest.Mock;
  findOne: jest.Mock;
  find: jest.Mock;
  findAndCount: jest.Mock;
  delete: jest.Mock;
  manager: { transaction: jest.Mock };
};

const makeRepo = (): RepoMock => ({
  create: jest.fn().mockImplementation((x) => ({ id: 'gen-id', ...x })),
  save: jest.fn().mockImplementation(function (x: unknown) {
    if (Array.isArray(x)) {
      return Promise.resolve(
        (x as Record<string, unknown>[]).map((i) => ({ ...i, id: 'gen-id' })),
      );
    }
    return Promise.resolve({ ...(x as Record<string, unknown>), id: 'gen-id' });
  }),
  findOne: jest.fn().mockResolvedValue(null),
  find: jest.fn().mockResolvedValue([]),
  findAndCount: jest.fn().mockResolvedValue([[], 0]),
  delete: jest.fn().mockResolvedValue({ affected: 1 }),
  manager: { transaction: jest.fn() },
});

function mockTransaction(advanceRepo: RepoMock, itemRepo: RepoMock) {
  advanceRepo.manager.transaction.mockImplementation(
    async (cb: (m: unknown) => Promise<unknown>) => {
      const manager = {
        getRepository: jest.fn().mockImplementation((entity: unknown) => {
          if (entity === AdvanceRequest) return advanceRepo;
          return itemRepo;
        }),
      };
      return cb(manager);
    },
  );
}

describe('AdvanceCoreService', () => {
  let advanceRepo: RepoMock;
  let repaymentRepo: RepoMock;
  let itemRepo: RepoMock;
  let service: AdvanceCoreService;

  beforeEach(() => {
    advanceRepo = makeRepo();
    repaymentRepo = makeRepo();
    itemRepo = makeRepo();
    service = new AdvanceCoreService(
      advanceRepo as never,
      repaymentRepo as never,
    );
  });

  describe('createRequest', () => {
    it('creates a request without items', async () => {
      const dto = { employeeId: 'e1', amount: 1000 };
      const savedRequest = {
        id: 'r1',
        employeeId: 'e1',
        amount: 1000,
        isDeleted: false,
        requestNo: 'REQ-001',
        type: 'DEPARTMENT',
      } as unknown as AdvanceRequest;
      advanceRepo.save.mockResolvedValue(savedRequest);
      advanceRepo.findOne.mockResolvedValue(savedRequest);
      mockTransaction(advanceRepo, itemRepo);

      const result = await service.createRequest(dto);

      expect(advanceRepo.manager.transaction).toHaveBeenCalled();
      expect(advanceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining(dto),
      );
      expect(result.id).toBe('r1');
    });

    it('creates a request with items', async () => {
      const dto = {
        employeeId: 'e1',
        amount: 1000,
        items: [
          { itemNo: 1, amount: 500 },
          { itemNo: 2, amount: 500 },
        ],
      };
      const savedRequest = {
        id: 'r1',
        employeeId: 'e1',
        amount: 1000,
        requestNo: 'REQ-001',
        type: 'DEPARTMENT',
      } as unknown as AdvanceRequest;
      advanceRepo.save.mockResolvedValue(savedRequest);
      advanceRepo.findOne.mockResolvedValue(savedRequest);
      mockTransaction(advanceRepo, itemRepo);

      await service.createRequest(dto);

      expect(advanceRepo.manager.transaction).toHaveBeenCalled();
      expect(itemRepo.save).toHaveBeenCalled();
    });
  });

  describe('findRequestById', () => {
    it('returns a request with relations', async () => {
      const entity = {
        id: 'r1',
        employeeId: 'e1',
        amount: 1000,
        repayments: [],
        items: [],
        requestNo: 'REQ-001',
        type: 'DEPARTMENT',
      } as unknown as AdvanceRequest;
      advanceRepo.findOne.mockResolvedValue(entity);

      const result = await service.findRequestById('r1');

      expect(advanceRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'r1' },
        relations: { repayments: true, items: true },
      });
      expect(result).not.toBeNull();
      expect(result && result.id).toBe('r1');
    });

    it('returns null when not found', async () => {
      advanceRepo.findOne.mockResolvedValue(null);

      const result = await service.findRequestById('missing');

      expect(result).toBeNull();
    });
  });

  describe('listRequests', () => {
    it('applies tenantId and pagination filters', async () => {
      const requests = [
        {
          id: 'r1',
          employeeId: 'e1',
          amount: 1000,
          requestNo: 'REQ-001',
          type: 'DEPARTMENT',
        },
      ] as unknown as AdvanceRequest[];
      advanceRepo.findAndCount.mockResolvedValue([requests, 1]);

      const result = await service.listRequests({
        tenantId: 't1',
        page: 1,
        limit: 10,
      });

      expect(advanceRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 't1', isDeleted: false }),
          skip: 0,
          take: 10,
          order: { createdAt: 'DESC' },
        }),
      );
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('applies employeeId and status filters', async () => {
      await service.listRequests({ employeeId: 'e1', status: 'PENDING' });

      expect(advanceRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            employeeId: 'e1',
            status: 'PENDING',
            isDeleted: false,
          }),
        }),
      );
    });
  });

  describe('updateRequest', () => {
    it('throws when request is not found', async () => {
      advanceRepo.findOne.mockResolvedValue(null);
      mockTransaction(advanceRepo, itemRepo);

      await expect(service.updateRequest('missing', {})).rejects.toThrow(
        'Advance request not found',
      );
    });

    it('updates request and replaces items', async () => {
      const existing = {
        id: 'r1',
        employeeId: 'e1',
        amount: 1000,
        items: [],
        requestNo: 'REQ-001',
        type: 'DEPARTMENT',
      } as unknown as AdvanceRequest;
      advanceRepo.findOne.mockResolvedValue(existing);
      advanceRepo.save.mockResolvedValue({ ...existing, amount: 2000 });
      advanceRepo.findOne.mockResolvedValue({ ...existing, amount: 2000 });
      mockTransaction(advanceRepo, itemRepo);

      const result = await service.updateRequest('r1', {
        amount: 2000,
        items: [{ itemNo: 1, amount: 2000 }],
      });

      expect(result.id).toBe('r1');
      expect(advanceRepo.manager.transaction).toHaveBeenCalled();
      expect(itemRepo.delete).toHaveBeenCalledWith({ advanceRequestId: 'r1' });
      expect(itemRepo.save).toHaveBeenCalled();
    });
  });

  describe('updateRequestStatus', () => {
    it('throws when request is not found', async () => {
      advanceRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateRequestStatus('missing', 'APPROVED'),
      ).rejects.toThrow('Advance request not found');
    });

    it('updates status and sets disbursedAt when DISBURSED', async () => {
      const entity = {
        id: 'r1',
        status: 'PENDING',
        requestNo: 'REQ-001',
        type: 'DEPARTMENT',
      } as unknown as AdvanceRequest;
      advanceRepo.findOne.mockResolvedValue(entity);
      advanceRepo.save.mockImplementation((x) => Promise.resolve(x));

      const result = await service.updateRequestStatus('r1', 'DISBURSED');

      expect(result.status).toBe('DISBURSED');
      expect(result.disbursedAt).toBeInstanceOf(Date);
    });
  });

  describe('deleteRequest', () => {
    it('throws when request is not found', async () => {
      advanceRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteRequest('missing')).rejects.toThrow(
        'Advance request not found',
      );
    });

    it('soft deletes and records deletedBy', async () => {
      const entity = {
        id: 'r1',
        isDeleted: false,
        requestNo: 'REQ-001',
        type: 'DEPARTMENT',
      } as unknown as AdvanceRequest;
      advanceRepo.findOne.mockResolvedValue(entity);
      advanceRepo.save.mockImplementation((x) => Promise.resolve(x));

      await service.deleteRequest('r1', 'user-1');

      expect(entity.isDeleted).toBe(true);
      expect(entity.deletedBy).toBe('user-1');
    });
  });

  describe('createRepayment', () => {
    it('throws when advance request is not found', async () => {
      advanceRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createRepayment({
          advanceRequestId: 'missing',
          installmentNo: 1,
          dueDate: new Date(),
          amount: 100,
        }),
      ).rejects.toThrow('Advance request not found');
    });

    it('creates a repayment', async () => {
      advanceRepo.findOne.mockResolvedValue({
        id: 'r1',
        requestNo: 'REQ-001',
        type: 'DEPARTMENT',
      } as unknown as AdvanceRequest);
      repaymentRepo.save.mockResolvedValue({
        id: 'rep1',
        advanceRequestId: 'r1',
        amount: 100,
      } as unknown as AdvanceRepayment);

      const result = await service.createRepayment({
        advanceRequestId: 'r1',
        installmentNo: 1,
        dueDate: new Date(),
        amount: 100,
      });

      expect(result.id).toBe('rep1');
    });
  });

  describe('listRepayments', () => {
    it('returns repayments ordered by installmentNo', async () => {
      const items = [
        { id: 'r1', installmentNo: 1 },
        { id: 'r2', installmentNo: 2 },
      ] as unknown as AdvanceRepayment[];
      repaymentRepo.find.mockResolvedValue(items);

      const result = await service.listRepayments('req-1');

      expect(repaymentRepo.find).toHaveBeenCalledWith({
        where: { advanceRequestId: 'req-1' },
        order: { installmentNo: 'ASC' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('markRepaymentPaid', () => {
    it('throws when repayment is not found', async () => {
      repaymentRepo.findOne.mockResolvedValue(null);

      await expect(service.markRepaymentPaid('missing')).rejects.toThrow(
        'Repayment not found',
      );
    });

    it('marks repayment as paid with custom paidAt', async () => {
      const entity = { id: 'rep1', paid: false } as unknown as AdvanceRepayment;
      repaymentRepo.findOne.mockResolvedValue(entity);
      repaymentRepo.save.mockImplementation((x) => Promise.resolve(x));
      const customDate = new Date('2024-06-01');

      const result = await service.markRepaymentPaid(
        'rep1',
        customDate,
        'payroll-1',
      );

      expect(result.paid).toBe(true);
      expect(result.paidAt).toBe(customDate);
      expect(result.payrollRunId).toBe('payroll-1');
    });

    it('marks repayment as paid with default paidAt', async () => {
      const entity = { id: 'rep1', paid: false } as unknown as AdvanceRepayment;
      repaymentRepo.findOne.mockResolvedValue(entity);
      repaymentRepo.save.mockImplementation((x) => Promise.resolve(x));

      const result = await service.markRepaymentPaid('rep1');

      expect(result.paid).toBe(true);
      expect(result.paidAt).toBeInstanceOf(Date);
    });
  });

  describe('calculateEligibleAmount', () => {
    it('returns max allowed minus existing advances', () => {
      const result = service.calculateEligibleAmount(1000, 100, 0.5);
      expect(result).toBe(400);
    });

    it('returns 0 when existing advances exceed max allowed', () => {
      const result = service.calculateEligibleAmount(1000, 600, 0.5);
      expect(result).toBe(0);
    });

    it('uses default maxPercent of 0.5', () => {
      const result = service.calculateEligibleAmount(1000, 0);
      expect(result).toBe(500);
    });
  });
});
