import { RoleService } from './role.service';

type RepoMock = {
  findOne: jest.Mock;
  find: jest.Mock;
  findAndCount: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  delete: jest.Mock;
};

const makeRepo = (): RepoMock => ({
  findOne: jest.fn(),
  find: jest.fn().mockResolvedValue([]),
  findAndCount: jest.fn().mockResolvedValue([[], 0]),
  create: jest.fn().mockImplementation((x) => x),
  save: jest.fn().mockImplementation((x) => Promise.resolve(x)),
  delete: jest.fn().mockResolvedValue({ affected: 1 }),
});

describe('RoleService', () => {
  let roleRepo: RepoMock;
  let permissionRepo: RepoMock;
  let userRoleRepo: RepoMock;
  let service: RoleService;

  beforeEach(() => {
    roleRepo = makeRepo();
    permissionRepo = makeRepo();
    userRoleRepo = makeRepo();
    service = new RoleService(
      roleRepo as never,
      permissionRepo as never,
      userRoleRepo as never,
    );
  });

  describe('create', () => {
    it('throws when the role code already exists', async () => {
      roleRepo.findOne.mockResolvedValue({ id: 'existing' });
      await expect(
        service.create({ name: 'Admin', code: 'ADMIN' } as never),
      ).rejects.toThrow('Role code already exists');
    });

    it('persists permissions when provided', async () => {
      roleRepo.findOne.mockResolvedValue(null);
      roleRepo.save.mockResolvedValue({ id: 'r1', code: 'ADMIN' });

      await service.create({
        name: 'Admin',
        code: 'ADMIN',
        permissions: [
          { resource: 'user', action: 'read' },
          { resource: 'user', action: 'write' },
        ],
      } as never);

      expect(permissionRepo.save).toHaveBeenCalledTimes(1);
      expect(permissionRepo.save.mock.calls[0][0]).toHaveLength(2);
    });

    it('skips permission creation when none are provided', async () => {
      roleRepo.findOne.mockResolvedValue(null);
      roleRepo.save.mockResolvedValue({ id: 'r1', code: 'ADMIN' });

      await service.create({ name: 'Admin', code: 'ADMIN' } as never);

      expect(permissionRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('throws when the role is missing', async () => {
      roleRepo.findOne.mockResolvedValue(null);
      await expect(
        service.update('missing', { name: 'X' } as never),
      ).rejects.toThrow('Role not found');
    });
  });

  describe('delete', () => {
    it('throws when the role is missing', async () => {
      roleRepo.findOne.mockResolvedValue(null);
      await expect(service.delete('missing')).rejects.toThrow('Role not found');
    });

    it('refuses to delete a system role', async () => {
      roleRepo.findOne.mockResolvedValue({ id: 'r1', isSystem: true });
      await expect(service.delete('r1')).rejects.toThrow(
        'Cannot delete system role',
      );
    });

    it('soft-deletes a non-system role', async () => {
      const role: Record<string, unknown> = { id: 'r1', isSystem: false };
      roleRepo.findOne.mockResolvedValue(role);

      await service.delete('r1');

      expect(role.isDeleted).toBe(true);
      expect(roleRepo.save).toHaveBeenCalledWith(role);
    });
  });

  describe('assignRole', () => {
    it('throws when the role does not exist', async () => {
      roleRepo.findOne.mockResolvedValue(null);
      await expect(service.assignRole('u1', 'r1')).rejects.toThrow(
        'Role not found',
      );
    });

    it('is a no-op when the assignment already exists', async () => {
      roleRepo.findOne.mockResolvedValue({ id: 'r1' });
      userRoleRepo.findOne.mockResolvedValue({ id: 'ur1' });

      await service.assignRole('u1', 'r1');

      expect(userRoleRepo.save).not.toHaveBeenCalled();
    });

    it('creates a new assignment when none exists', async () => {
      roleRepo.findOne.mockResolvedValue({ id: 'r1' });
      userRoleRepo.findOne.mockResolvedValue(null);

      await service.assignRole('u1', 'r1', 'admin', 't1');

      expect(userRoleRepo.create).toHaveBeenCalledWith({
        userId: 'u1',
        roleId: 'r1',
        assignedBy: 'admin',
        tenantId: 't1',
      });
      expect(userRoleRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('unassignRole', () => {
    it('deletes the user-role join row', async () => {
      await service.unassignRole('u1', 'r1');
      expect(userRoleRepo.delete).toHaveBeenCalledWith({
        userId: 'u1',
        roleId: 'r1',
      });
    });
  });

  describe('getUserRoles', () => {
    it('maps joined roles to the response shape', async () => {
      userRoleRepo.find.mockResolvedValue([
        {
          role: {
            id: 'r1',
            name: 'Admin',
            code: 'ADMIN',
            description: 'desc',
            isSystem: true,
            tenantId: 't1',
            createdAt: new Date(0),
            updatedAt: new Date(0),
          },
        },
      ]);

      const roles = await service.getUserRoles('u1');

      expect(roles).toHaveLength(1);
      expect(roles[0]).toMatchObject({ id: 'r1', code: 'ADMIN' });
    });
  });

  describe('findById', () => {
    it('returns null when the role is not found', async () => {
      roleRepo.findOne.mockResolvedValue(null);
      expect(await service.findById('missing')).toBeNull();
    });
  });

  describe('list', () => {
    it('applies tenant filter and default pagination', async () => {
      roleRepo.findAndCount.mockResolvedValue([[], 0]);
      await service.list({ tenantId: 't1' });
      expect(roleRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isDeleted: false, tenantId: 't1' },
          skip: 0,
          take: 20,
        }),
      );
    });
  });
});
