-- ============================================================
-- Salary Advance Service
-- ============================================================

CREATE TABLE advance_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  company_id        UUID,
  branch_id         UUID,
  request_no        VARCHAR(50) NOT NULL,
  employee_id       UUID NOT NULL,
  amount            DECIMAL(18,2) NOT NULL,
  currency          VARCHAR(3) NOT NULL DEFAULT 'USD',
  reason            TEXT,
  repayment_terms   INTEGER NOT NULL DEFAULT 1,
  status            VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  workflow_instance_id UUID,
  disbursed_at      TIMESTAMPTZ,
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

CREATE TABLE advance_repayments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advance_request_id UUID REFERENCES advance_requests(id),
  installment_no    INTEGER NOT NULL,
  due_date          DATE NOT NULL,
  amount            DECIMAL(18,2) NOT NULL,
  paid              BOOLEAN DEFAULT false,
  paid_at           TIMESTAMPTZ,
  payroll_run_id    UUID,
  -- audit
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ar_employee ON advance_requests(employee_id);
CREATE INDEX idx_ar_status   ON advance_requests(status);
CREATE INDEX idx_ar_tenant   ON advance_requests(tenant_id);
CREATE INDEX idx_areq_request ON advance_repayments(advance_request_id);
