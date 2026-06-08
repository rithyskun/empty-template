import { LdapService } from './ldap.service';

describe('LdapService', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  describe('authenticate (simulation mode, LDAP disabled)', () => {
    let service: LdapService;

    beforeEach(() => {
      process.env.LDAP_ENABLED = 'false';
      service = new LdapService();
    });

    it('authenticates the simulated admin user', async () => {
      const result = await service.authenticate('ldap-admin', 'password123');
      expect(result).not.toBeNull();
      expect(result?.email).toBe('admin@erp.local');
      expect(result?.groups).toContain(
        'CN=Domain Admins,CN=Users,DC=erp,DC=local',
      );
    });

    it('authenticates the simulated manager user', async () => {
      const result = await service.authenticate(
        'manager@erp.local',
        'password123',
      );
      expect(result?.firstName).toBe('LDAP');
      expect(result?.lastName).toBe('Manager');
    });

    it('authenticates an arbitrary user with the simulation password', async () => {
      const result = await service.authenticate('alice', 'password123');
      expect(result?.username).toBe('alice');
      expect(result?.email).toBe('alice@erp.local');
      expect(result?.groups).toEqual([]);
    });

    it('rejects an incorrect password', async () => {
      const result = await service.authenticate('alice', 'wrong-password');
      expect(result).toBeNull();
    });
  });

  describe('mapGroupsToRoles', () => {
    it('maps configured AD groups to platform roles', () => {
      process.env.LDAP_GROUP_TO_ROLE_MAPPING = JSON.stringify({
        'CN=HR Managers,OU=Groups,DC=erp,DC=local': ['MANAGER', 'HR'],
      });
      const service = new LdapService();

      const roles = service.mapGroupsToRoles([
        'CN=HR Managers,OU=Groups,DC=erp,DC=local',
      ]);
      expect(roles).toEqual(expect.arrayContaining(['MANAGER', 'HR']));
    });

    it('defaults to the USER role when no group mapping matches', () => {
      process.env.LDAP_GROUP_TO_ROLE_MAPPING = JSON.stringify({});
      const service = new LdapService();

      expect(service.mapGroupsToRoles(['CN=Unknown'])).toEqual(['USER']);
    });

    it('defaults to the USER role when given no groups', () => {
      process.env.LDAP_GROUP_TO_ROLE_MAPPING = JSON.stringify({});
      const service = new LdapService();

      expect(service.mapGroupsToRoles([])).toEqual(['USER']);
    });

    it('falls back to an empty mapping when the env JSON is invalid', () => {
      process.env.LDAP_GROUP_TO_ROLE_MAPPING = '{not-valid-json';
      const service = new LdapService();

      expect(service.mapGroupsToRoles(['anything'])).toEqual(['USER']);
    });

    it('deduplicates roles mapped from multiple groups', () => {
      process.env.LDAP_GROUP_TO_ROLE_MAPPING = JSON.stringify({
        'CN=A': ['MANAGER'],
        'CN=B': ['MANAGER', 'HR'],
      });
      const service = new LdapService();

      const roles = service.mapGroupsToRoles(['CN=A', 'CN=B']);
      expect(roles.sort()).toEqual(['HR', 'MANAGER']);
    });
  });
});
