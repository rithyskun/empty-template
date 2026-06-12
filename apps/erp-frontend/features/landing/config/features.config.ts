import type { Component } from 'vue';
import {
  DollarSign,
  CheckCircle,
  CreditCard,
  FileText,
  BarChart3,
  Settings,
  Zap,
  Eye,
} from 'lucide-vue-next';

export interface FeatureTile {
  id: string;
  label: string;
  description: string;
  path: string;
  icon: Component;
  requiredRole?: string;
  color: string;
  bgColor: string;
}

export const featureTiles: FeatureTile[] = [
  {
    id: 'advances',
    label: 'Advances',
    description: 'Manage employee advances and repayment schedules',
    path: '/advances/dashboard',
    icon: DollarSign,
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
    icon: CheckCircle,
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
    icon: CreditCard,
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
    icon: FileText,
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
    icon: BarChart3,
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
    icon: Settings,
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
    icon: Zap,
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
    icon: Eye,
    // requiredRole: 'AUDIT_READ',
    color: 'text-orange-700 dark:text-orange-300',
    bgColor:
      'bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30',
  },
];
