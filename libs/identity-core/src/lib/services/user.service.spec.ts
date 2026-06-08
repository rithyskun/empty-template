import { UserService } from './user.service';
import { DomainException } from '@erp/common';

type RepoMock = {
  findOne: jest.Mock;
  findById?: jest.Mock;
  find: jest.Mock;
  findBy: jest.Mock;
  findAndCount: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
};

const makeRepo = (): RepoMock => ({
  findOne: jest.fn(),
  find: jest.fn().mockResolvedValue([]),
  findBy: jest.fn().mockResolvedValue([]),
  findAndCount: jest.fn().mockResolvedValue([[], 0]),
  create: jest.fn().mockImplementation((x) => x),
  save: jest.fn().mockImplementation((x) => Promise.resolve(x)),
});

describe('UserService', () => {
  let userRepo: RepoMock;
  let userRoleRepo: RepoMock;
  let roleRepo: RepoMock;
  let service: UserService;

  beforeEach(() => {
    userRepo = makeRepo();
    userRoleRepo = makeRepo();
    roleRepo = makeRepo();
    service = new UserService(
      userRepo as never,
      userRoleRepo as never,
      roleRepo as never,
    );
  });

  describe('password hashing', () => {
    it('hashes the password as salt:hash and verifies it', async () => {
      userRepo.findOne.mockResolvedValue(null);
      let storedHash = '';
      userRepo.save.mockImplementation((u: { passwordHash: string }) => {
        storedHash = u.passwordHash;
        return Promise.resolve({ ...u, id: 'u1' });
      });

      await service.create({
        email: 'a@erp.local',
        password: 'super-secret',
        firstName: 'A',
        lastName: 'B',
      } as never);

      expect(storedHash).toMatch(/^[0-9a-f]+:[0-9a-f]+$/);
      expect(service.verifyPassword('super-secret', storedHash)).toBe(true);
      expect(service.verifyPassword('wrong-password', storedHash)).toBe(false);
    });
  });

  describe('create', () => {
    it('throws when the email is already in use', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create({
          email: 'dupe@erp.local',
          password: 'x',
          firstName: 'A',
          lastName: 'B',
        } as never),
      ).rejects.toThrow(DomainException);
    });

    it('assigns roles when roleIds are provided', async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.save.mockResolvedValue({ id: 'u1', email: 'a@erp.local' });
      roleRepo.findBy.mockResolvedValue([{ id: 'r1' }, { id: 'r2' }]);

      await service.create({
        email: 'a@erp.local',
        password: 'x',
        firstName: 'A',
        lastName: 'B',
        roleIds: ['r1', 'r2'],
      } as never);

      expect(userRoleRepo.save).toHaveBeenCalledTimes(1);
      const savedRoles = userRoleRepo.save.mock.calls[0][0];
      expect(savedRoles).toHaveLength(2);
    });

    it('does not touch user roles when no roleIds are given', async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.save.mockResolvedValue({ id: 'u1' });

      await service.create({
        email: 'a@erp.local',
        password: 'x',
        firstName: 'A',
        lastName: 'B',
      } as never);

      expect(userRoleRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('throws when the user does not exist', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(
        service.update('missing', { firstName: 'X' } as never),
      ).rejects.toThrow('User not found');
    });

    it('merges the dto and saves', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'u1', firstName: 'Old' });
      userRepo.save.mockImplementation((u) => Promise.resolve(u));

      await service.update('u1', { firstName: 'New' } as never);

      const saved = userRepo.save.mock.calls[0][0];
      expect(saved.firstName).toBe('New');
    });
  });

  describe('delete', () => {
    it('throws when the user does not exist', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.delete('missing')).rejects.toThrow('User not found');
    });

    it('soft-deletes and records deletedBy', async () => {
      const user: Record<string, unknown> = { id: 'u1' };
      userRepo.findOne.mockResolvedValue(user);

      await service.delete('u1', 'admin');

      expect(user.isDeleted).toBe(true);
      expect(user.deletedBy).toBe('admin');
      expect(userRepo.save).toHaveBeenCalledWith(user);
    });
  });

  describe('list', () => {
    it('applies default pagination and tenant filter', async () => {
      userRepo.findAndCount.mockResolvedValue([[{ id: 'u1' }], 1]);

      const result = await service.list({ tenantId: 't1' });

      expect(result.total).toBe(1);
      expect(userRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isDeleted: false, tenantId: 't1' },
          skip: 0,
          take: 20,
        }),
      );
    });

    it('computes skip from the page number', async () => {
      userRepo.findAndCount.mockResolvedValue([[], 0]);
      await service.list({ page: 3, limit: 10 });
      expect(userRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });
  });

  describe('lookups', () => {
    it('findByEmail delegates to the repository', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'u1' });
      await service.findByEmail('a@erp.local');
      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { email: 'a@erp.local' },
      });
    });

    it('findById delegates to the repository', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'u1' });
      await service.findById('u1');
      expect(userRepo.findOne).toHaveBeenCalledWith({ where: { id: 'u1' } });
    });
  });
});
