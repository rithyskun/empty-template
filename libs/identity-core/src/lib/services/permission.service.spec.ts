import { PermissionService } from './permission.service';

type RepoMock = {
  findOne: jest.Mock;
  find: jest.Mock;
  findAndCount: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  delete: jest.Mock;
  remove: jest.Mock;
};

const makeRepo = (): RepoMock => ({
  findOne: jest.fn(),
  find: jest.fn().mockResolvedValue([]),
  findAndCount: jest.fn().mockResolvedValue([[], 0]),
  create: jest.fn().mockImplementation((x) => x),
  save: jest.fn().mockImplementation((x) => Promise.resolve(x)),
  delete: jest.fn().mockResolvedValue({ affected: 1 }),
  remove: jest.fn().mockResolvedValue({}),
});

describe('PermissionService', () => {
  let permissionRepo: RepoMock;
  let roleRepo: RepoMock;
  let userRoleRepo: RepoMock;
  let service: PermissionService;

  beforeEach(() => {
    permissionRepo = makeRepo();
    roleRepo = makeRepo();
    userRoleRepo = makeRepo();
    service = new PermissionService(
      permissionRepo as never,
      roleRepo as never,
      userRoleRepo as never,
    );
  });

  describe('create', () => {
    it('throws when the role does not exist', async () => {
      roleRepo.findOne.mockResolvedValue(null);
      await expect(
        service.create({ roleId: 'r1', resource: 'users', action: 'read' }),
      ).rejects.toThrow('Role not found');
    });

    it('throws when the permission already exists', async () => {
      roleRepo.findOne.mockResolvedValue({ id: 'r1' });
      permissionRepo.findOne.mockResolvedValue({ id: 'p1' });
      await expect(
        service.create({ roleId: 'r1', resource: 'users', action: 'read' }),
      ).rejects.toThrow('Permission already exists');
    });

    it('creates and returns the permission', async () => {
      roleRepo.findOne.mockResolvedValue({ id: 'r1' });
      permissionRepo.findOne.mockResolvedValue(null);
      permissionRepo.save.mockResolvedValue({
        id: 'p1',
        roleId: 'r1',
        resource: 'users',
        action: 'read',
      });

      const result = await service.create({
        roleId: 'r1',
        resource: 'users',
        action: 'read',
      });

      expect(result.resource).toBe('users');
      expect(result.action).toBe('read');
    });
  });

  describe('update', () => {
    it('throws when the permission is missing', async () => {
      permissionRepo.findOne.mockResolvedValue(null);
      await expect(
        service.update('missing', { resource: 'x' }),
      ).rejects.toThrow('Permission not found');
    });

    it('updates and returns the permission', async () => {
      const perm = { id: 'p1', resource: 'users', action: 'read' };
      permissionRepo.findOne.mockResolvedValue(perm);
      permissionRepo.save.mockResolvedValue({ ...perm, action: 'write' });

      const result = await service.update('p1', { action: 'write' });
      expect(result.action).toBe('write');
    });
  });

  describe('delete', () => {
    it('throws when the permission is missing', async () => {
      permissionRepo.findOne.mockResolvedValue(null);
      await expect(service.delete('missing')).rejects.toThrow(
        'Permission not found',
      );
    });

    it('removes the permission', async () => {
      const perm = { id: 'p1' };
      permissionRepo.findOne.mockResolvedValue(perm);
      await service.delete('p1');
      expect(permissionRepo.remove).toHaveBeenCalledWith(perm);
    });
  });

  describe('setRolePermissions', () => {
    it('throws when the role does not exist', async () => {
      roleRepo.findOne.mockResolvedValue(null);
      await expect(
        service.setRolePermissions('r1', [
          { resource: 'users', action: 'read' },
        ]),
      ).rejects.toThrow('Role not found');
    });

    it('deletes existing permissions and creates new ones', async () => {
      roleRepo.findOne.mockResolvedValue({ id: 'r1' });
      permissionRepo.save.mockResolvedValue([
        { id: 'p1', roleId: 'r1', resource: 'users', action: 'read' },
      ]);

      const result = await service.setRolePermissions('r1', [
        { resource: 'users', action: 'read' },
      ]);

      expect(permissionRepo.delete).toHaveBeenCalledWith({ roleId: 'r1' });
      expect(result).toHaveLength(1);
      expect(result[0].resource).toBe('users');
    });

    it('returns empty array when no permissions are provided', async () => {
      roleRepo.findOne.mockResolvedValue({ id: 'r1' });
      const result = await service.setRolePermissions('r1', []);
      expect(permissionRepo.delete).toHaveBeenCalledWith({ roleId: 'r1' });
      expect(result).toHaveLength(0);
    });
  });

  describe('getUserPermissions', () => {
    it('returns empty array when user has no roles', async () => {
      userRoleRepo.find.mockResolvedValue([]);
      const perms = await service.getUserPermissions('u1');
      expect(perms).toEqual([]);
    });

    it('returns deduplicated resource:action strings', async () => {
      userRoleRepo.find.mockResolvedValue([{ roleId: 'r1' }, { roleId: 'r2' }]);
      permissionRepo.find.mockResolvedValue([
        { resource: 'users', action: 'read' },
        { resource: 'users', action: 'write' },
        { resource: 'users', action: 'read' },
      ]);

      const perms = await service.getUserPermissions('u1');
      expect(perms).toEqual(['users:read', 'users:write']);
    });
  });

  describe('hasPermission', () => {
    it('returns true when the exact permission exists', async () => {
      userRoleRepo.find.mockResolvedValue([{ roleId: 'r1' }]);
      permissionRepo.find.mockResolvedValue([
        { resource: 'users', action: 'read' },
      ]);
      const result = await service.hasPermission('u1', 'users', 'read');
      expect(result).toBe(true);
    });

    it('returns true for wildcard all:all', async () => {
      userRoleRepo.find.mockResolvedValue([{ roleId: 'r1' }]);
      permissionRepo.find.mockResolvedValue([
        { resource: 'all', action: 'all' },
      ]);
      const result = await service.hasPermission('u1', 'users', 'read');
      expect(result).toBe(true);
    });

    it('returns false when the permission is missing', async () => {
      userRoleRepo.find.mockResolvedValue([{ roleId: 'r1' }]);
      permissionRepo.find.mockResolvedValue([
        { resource: 'users', action: 'read' },
      ]);
      const result = await service.hasPermission('u1', 'payments', 'write');
      expect(result).toBe(false);
    });
  });

  describe('list', () => {
    it('applies roleId and tenantId filters', async () => {
      await service.list({ roleId: 'r1', tenantId: 't1' });
      expect(permissionRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { roleId: 'r1', tenantId: 't1' },
          skip: 0,
          take: 20,
        }),
      );
    });
  });
});
