import { Injectable, Logger } from '@nestjs/common';

export interface LdapUserResult {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  groups: string[];
}

@Injectable()
export class LdapService {
  private readonly logger = new Logger(LdapService.name);

  private readonly enabled: boolean;
  private readonly url: string;
  private readonly searchBase: string;
  private readonly bindDn: string;
  private readonly groupMapping: Record<string, string[]>;

  constructor() {
    this.enabled = process.env.LDAP_ENABLED === 'true';
    this.url = process.env.LDAP_URL || 'ldap://localhost:389';
    this.bindDn = process.env.LDAP_BIND_DN || '';
    this.searchBase = process.env.LDAP_SEARCH_BASE || '';

    // Parse Group to Role mappings from JSON string safely
    try {
      this.groupMapping = JSON.parse(
        process.env.LDAP_GROUP_TO_ROLE_MAPPING || '{}',
      );
    } catch (e) {
      this.logger.error(
        'Failed to parse LDAP_GROUP_TO_ROLE_MAPPING JSON, defaulting to empty mapping',
      );
      this.groupMapping = {};
    }
  }

  /**
   * Authenticates a user against Active Directory / LDAP
   * and returns the user properties and their security groups.
   */
  async authenticate(
    username: string,
    password: string,
  ): Promise<LdapUserResult | null> {
    if (!this.enabled) {
      // Offline/local AD Simulation for testing
      return this.simulateLdapAuth(username, password);
    }

    this.logger.log(
      `Attempting LDAP/AD authentication for user: ${username} on ${this.url}`,
    );

    try {
      // In production, you would load 'ldapts' or 'ldapjs' dynamically
      // to avoid compile-time issues if binary packages are not globally pre-cached
      // We implement the structural LDAP auth flow below:

      const { Client } = require('ldapts');
      const client = new Client({ url: this.url });

      // 1. Bind to LDAP with Service Account to perform searches
      await client.bind(this.bindDn, process.env.LDAP_BIND_PASSWORD || '');
      this.logger.debug('Successfully bound LDAP Service Account');

      // 2. Locate the specific User DN using username filter
      const searchFilter = (
        process.env.LDAP_USER_SEARCH_FILTER ||
        '(&(objectClass=user)(sAMAccountName={{username}}))'
      ).replace('{{username}}', username);

      const { searchEntries } = await client.search(this.searchBase, {
        filter: searchFilter,
        scope: 'sub',
        attributes: [
          'dn',
          'mail',
          'givenName',
          'sn',
          'sAMAccountName',
          'memberOf',
        ],
      });

      if (!searchEntries || searchEntries.length === 0) {
        this.logger.warn(
          `User ${username} not found in LDAP search base ${this.searchBase}`,
        );
        await client.unbind();
        return null;
      }

      const userEntry = searchEntries[0];
      const userDn = userEntry.dn;
      this.logger.debug(`Found LDAP User DN: ${userDn}`);

      // 3. Authenticate the actual user by attempting a Re-Bind with their DN and Password
      const userClient = new Client({ url: this.url });
      try {
        await userClient.bind(userDn, password);
        this.logger.log(
          `LDAP credential verification succeeded for user: ${username}`,
        );
      } catch (bindErr) {
        this.logger.warn(
          `LDAP credential verification failed for user: ${username} - ${(bindErr as Error).message}`,
        );
        await userClient.unbind();
        await client.unbind();
        return null;
      }

      // 4. Resolve Groups (via 'memberOf' property or direct group search)
      let groups: string[] = [];
      if (Array.isArray(userEntry.memberOf)) {
        groups = userEntry.memberOf.map((g: any) => String(g));
      } else if (userEntry.memberOf) {
        groups = [String(userEntry.memberOf)];
      }

      // 5. Clean up connections
      await userClient.unbind();
      await client.unbind();

      return {
        username: String(userEntry.sAMAccountName || username),
        email: String(userEntry.mail || `${username}@erp.local`),
        firstName: String(userEntry.givenName || username),
        lastName: String(userEntry.sn || 'LDAP-User'),
        groups,
      };
    } catch (err) {
      this.logger.error(
        `Unhandled exception during LDAP auth for ${username}: ${(err as Error).message}`,
      );
      return null;
    }
  }

  /**
   * Maps LDAP / AD Groups to Platform Roles based on JSON mappings configured in .env
   */
  mapGroupsToRoles(groups: string[]): string[] {
    const roles: Set<string> = new Set();

    for (const group of groups) {
      const mapped = this.groupMapping[group];
      if (mapped && Array.isArray(mapped)) {
        mapped.forEach((r) => roles.add(r));
      }
    }

    // Default to USER role if no groups are mapped
    if (roles.size === 0) {
      roles.add('USER');
    }

    return Array.from(roles);
  }

  /**
   * Safe, zero-dependency LDAP AD authentication simulator for local dev/testing
   */
  private simulateLdapAuth(
    username: string,
    password: string,
  ): LdapUserResult | null {
    this.logger.warn(
      `LDAP integration is disabled (LDAP_ENABLED=false). Using local AD simulation.`,
    );

    if (password !== 'password123') {
      this.logger.warn(
        `LDAP Simulation failed: Incorrect password for user: ${username}`,
      );
      return null;
    }

    if (username === 'ldap-admin' || username === 'admin@erp.local') {
      return {
        username: 'ldap-admin',
        email: 'admin@erp.local',
        firstName: 'LDAP',
        lastName: 'Admin',
        groups: [
          'CN=Domain Admins,CN=Users,DC=erp,DC=local',
          'CN=ERP_SUPER_ADMINS,OU=Groups,DC=erp,DC=local',
        ],
      };
    }

    if (username === 'ldap-manager' || username === 'manager@erp.local') {
      return {
        username: 'ldap-manager',
        email: 'manager@erp.local',
        firstName: 'LDAP',
        lastName: 'Manager',
        groups: ['CN=HR Managers,OU=Groups,DC=erp,DC=local'],
      };
    }

    // Default regular simulated LDAP user
    return {
      username: username,
      email: `${username}@erp.local`,
      firstName: username.charAt(0).toUpperCase() + username.slice(1),
      lastName: 'AD-User',
      groups: [],
    };
  }
}
