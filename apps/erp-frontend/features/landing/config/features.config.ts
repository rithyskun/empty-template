export interface FeatureTile {
  id: string;
  label: string;
  description: string;
  path: string;
  icon: string;
  requiredRole?: string;
  color: string;
  bgColor: string;
}

export const featureTiles: FeatureTile[] = [
  {
    id: 'advances',
    label: 'Advances',
    description: 'Manage employee advances and repayment schedules',
    path: '/advances',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    // requiredRole: 'ADVANCES_READ',
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor:
      'bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30',
  },
  {
    id: 'settlements',
    label: 'Settlements',
    description: 'Process and track batch settlements between banks',
    path: '/settlements',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0zm3-10v4m0 0H4m15 0h-6',
    // requiredRole: 'SETTLEMENTS_READ',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor:
      'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30',
  },
  {
    id: 'payments',
    label: 'Payments',
    description: 'Execute and monitor outgoing payment transactions',
    path: '/payments',
    icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
    // requiredRole: 'PAYMENTS_READ',
    color: 'text-violet-700 dark:text-violet-300',
    bgColor:
      'bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/30',
  },
  {
    id: 'reconciliation',
    label: 'Reconciliation',
    description: 'Auto-match transactions and handle exceptions',
    path: '/reconciliation',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    // requiredRole: 'RECONCILIATION_READ',
    color: 'text-amber-700 dark:text-amber-300',
    bgColor:
      'bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30',
  },
  {
    id: 'reports',
    label: 'Reports',
    description: 'Generate and download financial reports',
    path: '/reports',
    icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    // requiredRole: 'REPORTS_READ',
    color: 'text-rose-700 dark:text-rose-300',
    bgColor:
      'bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30',
  },
  {
    id: 'administration',
    label: 'Administration',
    description: 'Manage users, roles, permissions and system settings',
    path: '/administration',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    // requiredRole: 'ADMIN',
    color: 'text-slate-700 dark:text-slate-300',
    bgColor:
      'bg-slate-50 dark:bg-slate-900/20 hover:bg-slate-100 dark:hover:bg-slate-900/30',
  },
  {
    id: 'workflow',
    label: 'Workflow',
    description: 'Design and monitor approval workflows',
    path: '/workflows',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    // requiredRole: 'WORKFLOW_READ',
    color: 'text-cyan-700 dark:text-cyan-300',
    bgColor:
      'bg-cyan-50 dark:bg-cyan-900/20 hover:bg-cyan-100 dark:hover:bg-cyan-900/30',
  },
  {
    id: 'audit',
    label: 'Audit Logs',
    description: 'View system audit trails and compliance logs',
    path: '/audit',
    icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
    // requiredRole: 'AUDIT_READ',
    color: 'text-orange-700 dark:text-orange-300',
    bgColor:
      'bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30',
  },
];
