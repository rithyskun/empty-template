-- ============================================================
-- Loan Service
-- ============================================================

CREATE TABLE loan_applications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  company_id        UUID,
  branch_id         UUID,
  application_no    VARCHAR(50) NOT NULL,
  employee_id       UUID NOT NULL,
  principal         DECIMAL(18,2) NOT NULL,
  interest_rate     DECIMAL(5,2) NOT NULL,
  term_months       INTEGER NOT NULL,
  monthly_payment   DECIMAL(18,2),
  purpose           TEXT,
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

CREATE TABLE loan_repayments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_application_id UUID REFERENCES loan_applications(id),
  installment_no      INTEGER NOT NULL,
  due_date            DATE NOT NULL,
  principal           DECIMAL(18,2) NOT NULL,
  interest            DECIMAL(18,2) NOT NULL,
  total               DECIMAL(18,2) NOT NULL,
  balance             DECIMAL(18,2) NOT NULL,
  paid                BOOLEAN DEFAULT false,
  paid_at             TIMESTAMPTZ,
  payroll_run_id      UUID,
  -- audit
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_la_employee ON loan_applications(employee_id);
CREATE INDEX idx_la_status   ON loan_applications(status);
CREATE INDEX idx_la_tenant   ON loan_applications(tenant_id);
CREATE INDEX idx_lr_loan     ON loan_repayments(loan_application_id);
