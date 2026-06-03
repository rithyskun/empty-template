-- ============================================================
-- Settlement Service
-- ============================================================

CREATE TABLE settlement_batches (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  company_id        UUID,
  branch_id         UUID,
  batch_no          VARCHAR(50) NOT NULL,
  settlement_type   VARCHAR(50) NOT NULL,  -- PAYROLL, ADVANCE, LOAN, AP, AR, EXPENSE
  total_amount      DECIMAL(18,2) NOT NULL,
  currency          VARCHAR(3) NOT NULL DEFAULT 'USD',
  scheduled_date    DATE NOT NULL,
  executed_at       TIMESTAMPTZ,
  status            VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  workflow_instance_id UUID,
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

CREATE TABLE settlement_transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id          UUID REFERENCES settlement_batches(id),
  tenant_id         UUID,
  company_id        UUID,
  branch_id         UUID,
  employee_id       UUID,
  vendor_id         UUID,
  customer_id       UUID,
  amount            DECIMAL(18,2) NOT NULL,
  currency          VARCHAR(3) NOT NULL DEFAULT 'USD',
  payment_type      VARCHAR(50) NOT NULL,
  account_number    VARCHAR(100),
  reference         VARCHAR(255),
  status            VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  payment_id        UUID,
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
CREATE INDEX idx_sb_tenant  ON settlement_batches(tenant_id);
CREATE INDEX idx_sb_type    ON settlement_batches(settlement_type);
CREATE INDEX idx_sb_status  ON settlement_batches(status);
CREATE INDEX idx_st_batch   ON settlement_transactions(batch_id);
CREATE INDEX idx_st_employee ON settlement_transactions(employee_id);
