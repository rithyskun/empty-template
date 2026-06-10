export type AuthType = 'public' | 'jwt' | 'internal';

export interface ServiceRoute {
  prefix: string;
  targetEnv: string;
  defaultHost: string;
  auth: AuthType;
  pathRewrite?: string;
}

export const EXTERNAL_ROUTES: ServiceRoute[] = [
  {
    prefix: '/api/v1/auth',
    targetEnv: 'AUTH_SERVICE_URL',
    defaultHost: 'http://localhost:8001',
    auth: 'public',
    pathRewrite: '/api/auth',
  },
  {
    prefix: '/api/v1/identity',
    targetEnv: 'IDENTITY_SERVICE_URL',
    defaultHost: 'http://localhost:8002',
    auth: 'jwt',
  },
  {
    prefix: '/api/v1/workflow',
    targetEnv: 'WORKFLOW_SERVICE_URL',
    defaultHost: 'http://localhost:8003',
    auth: 'jwt',
  },
  {
    prefix: '/api/v1/notifications',
    targetEnv: 'NOTIFICATION_SERVICE_URL',
    defaultHost: 'http://localhost:8004',
    auth: 'jwt',
  },
  {
    prefix: '/api/v1/payments',
    targetEnv: 'PAYMENT_SERVICE_URL',
    defaultHost: 'http://localhost:8005',
    auth: 'jwt',
  },
  {
    prefix: '/api/v1/settlements',
    targetEnv: 'SETTLEMENT_SERVICE_URL',
    defaultHost: 'http://localhost:8006',
    auth: 'jwt',
  },
  {
    prefix: '/api/v1/reconciliation',
    targetEnv: 'RECONCILIATION_SERVICE_URL',
    defaultHost: 'http://localhost:8008',
    auth: 'jwt',
  },
  {
    prefix: '/api/v1/advances',
    targetEnv: 'ADVANCE_SERVICE_URL',
    defaultHost: 'http://localhost:8010',
    auth: 'jwt',
  },
  {
    prefix: '/api/v1/reports',
    targetEnv: 'REPORT_SERVICE_URL',
    defaultHost: 'http://localhost:8017',
    auth: 'jwt',
  },
  {
    prefix: '/api/v1/scheduler',
    targetEnv: 'SCHEDULER_SERVICE_URL',
    defaultHost: 'http://localhost:8018',
    auth: 'jwt',
  },
  {
    prefix: '/api/v1/audit-logs',
    targetEnv: 'AUDIT_SERVICE_URL',
    defaultHost: 'http://localhost:8021',
    auth: 'jwt',
  },
];

export const INTERNAL_ROUTES: ServiceRoute[] = [
  {
    prefix: '/internal/v1/identity',
    targetEnv: 'IDENTITY_SERVICE_URL',
    defaultHost: 'http://localhost:8002',
    auth: 'internal',
  },
  {
    prefix: '/internal/v1/workflow',
    targetEnv: 'WORKFLOW_SERVICE_URL',
    defaultHost: 'http://localhost:8003',
    auth: 'internal',
  },
  {
    prefix: '/internal/v1/notifications',
    targetEnv: 'NOTIFICATION_SERVICE_URL',
    defaultHost: 'http://localhost:8004',
    auth: 'internal',
  },
  {
    prefix: '/internal/v1/payments',
    targetEnv: 'PAYMENT_SERVICE_URL',
    defaultHost: 'http://localhost:8005',
    auth: 'internal',
  },
  {
    prefix: '/internal/v1/settlements',
    targetEnv: 'SETTLEMENT_SERVICE_URL',
    defaultHost: 'http://localhost:8006',
    auth: 'internal',
  },
  {
    prefix: '/internal/v1/reconciliation',
    targetEnv: 'RECONCILIATION_SERVICE_URL',
    defaultHost: 'http://localhost:8008',
    auth: 'internal',
  },
  {
    prefix: '/internal/v1/advances',
    targetEnv: 'ADVANCE_SERVICE_URL',
    defaultHost: 'http://localhost:8010',
    auth: 'internal',
  },
  {
    prefix: '/internal/v1/reports',
    targetEnv: 'REPORT_SERVICE_URL',
    defaultHost: 'http://localhost:8017',
    auth: 'internal',
  },
  {
    prefix: '/internal/v1/scheduler',
    targetEnv: 'SCHEDULER_SERVICE_URL',
    defaultHost: 'http://localhost:8018',
    auth: 'internal',
  },
  {
    prefix: '/internal/v1/audit-logs',
    targetEnv: 'AUDIT_SERVICE_URL',
    defaultHost: 'http://localhost:8021',
    auth: 'internal',
  },
];

export const ALL_ROUTES: ServiceRoute[] = [
  ...EXTERNAL_ROUTES,
  ...INTERNAL_ROUTES,
];
