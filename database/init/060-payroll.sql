-- ============================================================
-- Payroll Service
-- ============================================================

CREATE TABLE payroll_runs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  company_id        UUID,
  branch_id         UUID,
  run_no            VARCHAR(50) NOT NULL,
  period_start      DATE NOT NULL,
  period_end        DATE NOT NULL,
  pay_date          DATE NOT NULL,
  total_gross       DECIMAL(18,2) DEFAULT 0,
  total_deductions  DECIMAL(18,2) DEFAULT 0,
  total_net         DECIMAL(18,2) DEFAULT 0,
  employee_count    INTEGER DEFAULT 0,
  status            VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  workflow_instance_id UUID,
  settlement_batch_id UUID,
  -- audit
  created_by        UUID,
  updated_by        UUID,
  approved_by       UUID,
  approved_at       TIMESTAMPTZ,
  trace_id          VARCHAR(255),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted        BOOLEAN DEFAULT false,
  deleted_at        TIMESTAMPTZ,
  deleted_by        UUID,
  version           INTEGER DEFAULT 0
);

CREATE TABLE payslips (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id    UUID REFERENCES payroll_runs(id),
  tenant_id         UUID,
  company_id        UUID,
  employee_id       UUID NOT NULL,
  basic_salary      DECIMAL(18,2) NOT NULL,
  allowances        JSONB DEFAULT '[]',
  deductions        JSONB DEFAULT '[]',
  gross_pay         DECIMAL(18,2) NOT NULL,
  total_deductions  DECIMAL(18,2) DEFAULT 0,
  net_pay           DECIMAL(18,2) NOT NULL,
  bank_account      VARCHAR(100),
  status            VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  -- audit
  created_by        UUID,
  updated_by        UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted        BOOLEAN DEFAULT false,
  deleted_at        TIMESTAMPTZ,
  deleted_by        UUID,
  version           INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX idx_pr_tenant   ON payroll_runs(tenant_id);
CREATE INDEX idx_pr_status   ON payroll_runs(status);
CREATE INDEX idx_ps_run      ON payslips(payroll_run_id);
CREATE INDEX idx_ps_employee ON payslips(employee_id);
