const ldap = require('ldapjs');

// Example LDAP data (you can replace this with your own data)
const users = {
  'CN=Skun.Rithy,OU=Branch Account and Support Unit,OU=Accounting Maintenance Department,OU=HEADOFFICES,DC=aba,DC=local':
    {
      filter: '(sAMAccountName=skun.rithy)',
      password: 'P@ssw0rd202424',
      scope: 'sub',
      attributes: {
        cn: 'Skun Rithy',
        sn: 'Fin',
        userPrincipalName: 'Skun.Rithy@aba.local',
        sAMAccountName: 'skun.rithy',
        displayName: 'Skun Rithy',
        objectClass: ['top', 'person', 'user'],
        objectCategory: 'person',
      },
      samaccountname: 'skun.rithy',
      mail: 'skun.rithy@aba.local',
      objectClass: ['top', 'person', 'user'],
      objectCategory: 'person',
    },
  'CN=Sothy.Rithy,OU=Branch Account and Support Unit,OU=Accounting Maintenance Department,OU=HEADOFFICES,DC=aba,DC=local':
    {
      filter: '(sAMAccountName=sothy.rithy)',
      password: 'P@ssw0rd202424',
      scope: 'sub',
      attributes: {
        cn: 'Sothy Rithy',
        sn: 'Fin',
        userPrincipalName: 'Sothy.Rithy@aba.local',
        sAMAccountName: 'sothy.rithy',
        displayName: 'Sothy Rithy',
        objectClass: ['top', 'person', 'user'],
        objectCategory: 'person',
      },
      samaccountname: 'sothy.rithy',
      mail: 'sothy.rithy@aba.local',
      objectClass: ['top', 'person', 'user'],
      objectCategory: 'person',
    },
  'CN=hr.team,DC=ABA,DC=LOCAL': {
    password: '123456789',
    filter: '(sAMAccountName=hr.team)',
    scope: 'sub',
    samaccountname: 'hr.team',
    attributes: {
      cn: 'HR Team',
      sn: 'HR',
      userPrincipalName: 'hr.team@aba.local',
      sAMAccountName: 'hr.team',
      displayName: 'HR Team',
      objectClass: ['top', 'person', 'user'],
      objectCategory: 'person',
    },
    mail: 'hr.team@aba.local',
    objectClass: ['top', 'person', 'user'],
    objectCategory: 'person',
  },
  'CN=Financial.Payroll,DC=ABA,DC=LOCAL': {
    password: 'Password2021',
    filter: '(sAMAccountName=Financial.Payroll)',
    scope: 'sub',
    samaccountname: 'Financial.Payroll',
    attributes: {
      dc: 'test',
      cn: 'Financial.Payroll',
      sn: 'Fin',
      userPrincipalName: 'Financial.Payroll@aba.local',
      sAMAccountName: 'Financial.Payroll',
      displayName: 'Financial Payroll',
      objectClass: ['top', 'person', 'user'],
      objectCategory: 'person',
      lastLogonTimestamp: 'now',
      manager: 'Financial Development',
    },
    mail: 'Financial.Payroll@aba.local',
    objectClass: ['top', 'person', 'user'],
    objectCategory: 'person',
  },
};

const server = ldap.createServer();

server.on('connection', function (client) {
  console.log('LDAP client connected');

  client.on('error', function (err) {
    console.error('LDAP client error:', err);
  });

  // connection-level events (bind handled by server.bind below)

  client.on('end', function () {
    console.log('LDAP client disconnected');
  });
});

server.search('', function (req, res, next) {
  const { baseObject, filter } = req;

  console.log(
    'LDAP search request (raw):',
    baseObject,
    filter && filter.toString && filter.toString(),
  );

  // Allow credentials passed in a special equality filter (auth=identifier||password||optionalBase)
  // This is necessary because some clients convert the base DN into an object and we can't embed raw strings there.
  const bound = req.connection?.boundUser;
  let modifiedFilter = filter;
  let authFound = null;
  function stripAuth(f) {
    if (!f) return null;
    // If compound filter, process children
    if (Array.isArray(f.filters)) {
      const remaining = [];
      for (const sf of f.filters) {
        const res = stripAuth(sf);
        if (res && res.isAuth) {
          authFound = res.auth;
          // skip adding this filter
        } else if (res) {
          remaining.push(res);
        }
      }
      // return a new filter node or null if none left
      return { type: f.type, filters: remaining };
    }

    // leaf: equality-like
    const attr = f.attribute || f.attr || null;
    const value = f.value !== undefined ? f.value : f.initial || null;
    if (attr && attr.toLowerCase() === 'auth' && value) {
      const parts = value.toString().split('||');
      const id = parts[0] || null;
      const pw = parts[1] || null;
      const base = parts.slice(2).join('') || '';
      authFound = { identifier: id, password: pw, actualBase: base };
      return { isAuth: true, auth: authFound };
    }
    return f;
  }

  try {
    modifiedFilter = stripAuth(filter) || filter;
  } catch (e) {
    modifiedFilter = filter;
  }

  if (!bound && !authFound) {
    console.log('Search denied: client not bound');
    return next(new ldap.InsufficientAccessRightsError('Bind required'));
  }

  // If authFound present and connection not bound, authenticate for this search
  if (!bound && authFound) {
    const { identifier, password, actualBase } = authFound;
    const found = findUserByIdentifier(identifier);
    if (!found) {
      console.log('Search bind failed: user not found for', identifier);
      return next(new ldap.InvalidCredentialsError());
    }
    const { dn: userDn, user } = found;
    if (password !== user.password) {
      console.log('Search bind failed: invalid password for', userDn);
      return next(new ldap.InvalidCredentialsError());
    }
    try {
      if (req.connection) req.connection.boundUser = { dn: userDn, user };
    } catch (e) {}
    console.log('Search bind succeeded for', userDn);
    // if actualBase provided, override baseObject for scoping below
    if (actualBase) req._searchActualBase = actualBase;
  }

  // Helper to get attribute values from a user
  function getAttrValues(user, attr) {
    if (!user) return [];
    const a = attr.toLowerCase();
    const vals = [];
    if (a === 'samaccountname') {
      if (user.samaccountname) vals.push(user.samaccountname);
      if (user.attributes?.sAMAccountName)
        vals.push(user.attributes.sAMAccountName);
    }
    if (a === 'userprincipalname') {
      if (user.userPrincipalName) vals.push(user.userPrincipalName);
      if (user.attributes?.userPrincipalName)
        vals.push(user.attributes.userPrincipalName);
    }
    if (a === 'mail' || a === 'email') {
      if (user.mail) vals.push(user.mail);
    }
    if (a === 'displayname') {
      if (user.attributes?.displayName) vals.push(user.attributes.displayName);
    }
    if (a === 'objectcategory') {
      if (user.objectCategory) vals.push(user.objectCategory);
      if (user.attributes?.objectCategory)
        vals.push(user.attributes.objectCategory);
    }
    if (a === 'objectclass') {
      if (Array.isArray(user.objectClass)) vals.push(...user.objectClass);
      if (user.attributes?.objectClass) vals.push(user.attributes.objectClass);
    }

    // fallback: try attributes object keys case-insensitively
    if (user.attributes) {
      for (const [k, v] of Object.entries(user.attributes)) {
        if (k.toLowerCase() === a) {
          if (Array.isArray(v)) vals.push(...v);
          else vals.push(v);
        }
      }
    }

    return vals.filter(Boolean).map((x) => x.toString());
  }

  function makeRegexFromValue(val) {
    // val can include '*' wildcards; escape other regex chars
    const escaped = val
      .replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&')
      .replace(/\\\*/g, '.*')
      .replace(/\*/g, '.*');
    return new RegExp('^' + escaped + '$', 'i');
  }

  // Evaluate ldapjs filter object recursively
  function matchFilter(user, f) {
    if (!f) return true;
    // AND / OR filters often have .filters array
    if (Array.isArray(f.filters) && f.type === 'and') {
      return f.filters.every((sf) => matchFilter(user, sf));
    }
    if (Array.isArray(f.filters) && f.type === 'or') {
      return f.filters.some((sf) => matchFilter(user, sf));
    }
    if (f.type === 'not' && f.filter) {
      return !matchFilter(user, f.filter);
    }

    // equality-like: attribute + value
    const attr = f.attribute || f.attr || null;
    const value = f.value !== undefined ? f.value : f.initial || null;
    if (f.type === 'present' || f.presence) {
      const vals = getAttrValues(user, attr || '');
      return vals.length > 0;
    }
    if (attr && value !== null && value !== undefined) {
      const re = makeRegexFromValue(value.toString());
      const vals = getAttrValues(user, attr);
      // allow matching against DN for 'dn' or 'distinguishedName'
      if (
        attr.toLowerCase() === 'dn' ||
        attr.toLowerCase() === 'distinguishedname'
      )
        vals.push(Object.keys(users).find((d) => d === d) || '');
      return vals.some((v) => re.test(v));
    }

    // fallback: try string form matching
    try {
      const s = f.toString ? f.toString() : '';
      // naive substring match against concatenated user attributes
      const hay = Object.values(user).join(' ').toLowerCase();
      return hay.includes(s.toLowerCase());
    } catch (e) {
      return false;
    }
  }

  console.log('DEBUG: starting search loop');
  for (const [dn, user] of Object.entries(users)) {
    // baseObject scoping (simple endsWith check when baseObject provided)
    // determine effective base (search-time override may be set via auth actualBase)
    const effectiveBase =
      req._searchActualBase && req._searchActualBase.toString().trim() !== ''
        ? req._searchActualBase.toString()
        : baseObject && baseObject.toString().trim() !== ''
          ? baseObject.toString()
          : '';
    if (effectiveBase) {
      const baseLower = effectiveBase.toLowerCase();
      if (!dn.toLowerCase().endsWith(baseLower)) continue;
    }

    console.log('DEBUG: checking', dn);
    const matchResult = matchFilter(user, modifiedFilter);
    console.log('DEBUG: matchFilter result:', matchResult);
    if (matchResult) {
      console.log('DEBUG: sending entry');
      res.send({ dn: dn, attributes: normalizeAttributes(user) });
    }
  }

  console.log('DEBUG: ending search');
  res.end();
  return next();
});

function normalizeAttributes(user) {
  const get = (key, def) => {
    const v = user.attributes?.[key];
    if (Array.isArray(v)) return v[0];
    return v !== undefined ? v : def;
  };

  return {
    cn: get('cn', 'Unknown'),
    department: get('department', []),
    sAMAccountName: get('sAMAccountName', user.samaccountname || 'N/A'),
    userAccountControl: get('userAccountControl', 'N/A'),
    displayName: get('displayName', 'Unknown'),
    userPrincipalName: get(
      'userPrincipalName',
      user.userPrincipalName || 'N/A',
    ),
    directReports: get('directReports', []),
    mail: user.mail || '',
    givenName: get('givenName', ''),
    sn: get('sn', ''),
    memberOf: [],
    objectGUID: '',
    objectSid: '',
  };
}

// Helper: find a user by several identifier formats
function findUserByIdentifier(identifier) {
  // exact DN key (case-insensitive)
  const idStr = (identifier || '').toString();
  const idLower = idStr.toLowerCase();
  for (const [dn, user] of Object.entries(users)) {
    if (dn.toLowerCase() === idLower) {
      return { dn, user };
    }
  }

  // If looks like an email/UPN (contains @) try matching userPrincipalName, mail or samaccountname
  if (idLower.includes('@')) {
    const local = idLower.split('@')[0];
    for (const [dn, user] of Object.entries(users)) {
      const upn = (
        user.attributes?.userPrincipalName ||
        user.userPrincipalName ||
        ''
      )
        .toString()
        .toLowerCase();
      const mail = (user.mail || '').toString().toLowerCase();
      const sam = (user.samaccountname || '').toString().toLowerCase();
      const attrSam = (user.attributes?.sAMAccountName || '')
        .toString()
        .toLowerCase();
      if (
        upn === idLower ||
        mail === idLower ||
        sam === local ||
        attrSam === local
      ) {
        return { dn, user };
      }
    }
  } else {
    // plain username: match samaccountname, or extract CN from a full DN
    let local = idLower;
    // If identifier looks like a full DN, extract the first CN value
    const cnMatch = idStr.match(/cn=([^,]+)/i);
    if (cnMatch) {
      local = cnMatch[1].toLowerCase();
    }
    for (const [dn, user] of Object.entries(users)) {
      const sam = (user.samaccountname || '').toString().toLowerCase();
      const attrSam = (user.attributes?.sAMAccountName || '')
        .toString()
        .toLowerCase();
      if (sam === local || attrSam === local) return { dn, user };
    }
  }

  return null;
}

server.bind('', function (req, res, next) {
  const { dn, credentials } = req;

  console.log('LDAP bind request (raw):', dn);

  const found = findUserByIdentifier(dn);
  if (!found) {
    console.log('User not found for identifier:', dn);
    return next(new ldap.InvalidCredentialsError());
  }

  const { dn: userDn, user } = found;

  // Compare passwords (plain-text in this test server)
  if (credentials !== user.password) {
    console.log('Invalid password for', userDn);
    return next(new ldap.InvalidCredentialsError());
  }

  console.log('Authentication successful for', userDn);
  try {
    if (req.connection) req.connection.boundUser = { dn: userDn, user };
  } catch (e) {}
  res.end();
  return next();
});

const port = process.env.LDAP_PORT || 1389;

server.listen(port, '127.0.0.1', () => {
  console.log(`LDAP server running at ldap://127.0.0.1:${port}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down LDAP server...');
  server.close(() => {
    console.log('LDAP server stopped');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\nShutting down LDAP server...');
  server.close(() => {
    console.log('LDAP server stopped');
    process.exit(0);
  });
});
