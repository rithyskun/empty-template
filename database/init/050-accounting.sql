-- ============================================================
-- Accounting Service
-- ============================================================

CREATE TABLE chart_of_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID,
  company_id      UUID,
  account_code    VARCHAR(20) NOT NULL,
  account_name    VARCHAR(255) NOT NULL,
  account_type    VARCHAR(50) NOT NULL,  -- ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
  parent_id       UUID REFERENCES chart_of_accounts(id),
  is_active       BOOLEAN DEFAULT true,
  -- audit
  created_by      UUID,
  updated_by      UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted      BOOLEAN DEFAULT false,
  deleted_at      TIMESTAMPTZ,
  deleted_by      UUID,
  version         INTEGER DEFAULT 0,
  UNIQUE(tenant_id, company_id, account_code)
);

CREATE TABLE accounting_periods (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID,
  company_id      UUID,
  period_name     VARCHAR(100) NOT NULL,
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  is_closed       BOOLEAN DEFAULT false,
  closed_at       TIMESTAMPTZ,
  closed_by       UUID,
  -- audit
  created_by      UUID,
  updated_by      UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, company_id, period_name)
);

CREATE TABLE journal_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID,
  company_id      UUID,
  branch_id       UUID,
  entry_no        VARCHAR(50) NOT NULL,
  entry_date      DATE NOT NULL,
  description     TEXT,
  period_id       UUID REFERENCES accounting_periods(id),
  status          VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  workflow_instance_id UUID,
  -- audit
  created_by      UUID,
  updated_by      UUID,
  approved_by     UUID,
  approved_at     TIMESTAMPTZ,
  trace_id        VARCHAR(255),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted      BOOLEAN DEFAULT false,
  deleted_at      TIMESTAMPTZ,
  deleted_by      UUID,
  version         INTEGER DEFAULT 0
);

CREATE TABLE journal_lines (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID REFERENCES journal_entries(id),
  account_id      UUID REFERENCES chart_of_accounts(id),
  account_code    VARCHAR(20) NOT NULL,
  entry_type      VARCHAR(10) NOT NULL,  -- DEBIT, CREDIT
  amount          DECIMAL(18,2) NOT NULL,
  description     TEXT,
  -- audit
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_je_tenant    ON journal_entries(tenant_id);
CREATE INDEX idx_je_period    ON journal_entries(period_id);
CREATE INDEX idx_je_status    ON journal_entries(status);
CREATE INDEX idx_jl_entry     ON journal_lines(journal_entry_id);
CREATE INDEX idx_jl_account   ON journal_lines(account_code);
CREATE INDEX idx_coa_code     ON chart_of_accounts(account_code);
