-- ============================================================
-- Treasury Service
-- ============================================================

CREATE TABLE bank_accounts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  company_id        UUID,
  branch_id         UUID,
  bank_name         VARCHAR(255) NOT NULL,
  account_name      VARCHAR(255) NOT NULL,
  account_number    VARCHAR(100) NOT NULL,
  currency          VARCHAR(3) NOT NULL DEFAULT 'USD',
  is_active         BOOLEAN DEFAULT true,
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

CREATE TABLE treasury_transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  company_id        UUID,
  branch_id         UUID,
  bank_account_id   UUID REFERENCES bank_accounts(id),
  transaction_no    VARCHAR(50) NOT NULL,
  transaction_type  VARCHAR(20) NOT NULL,  -- INFLOW, OUTFLOW, TRANSFER
  amount            DECIMAL(18,2) NOT NULL,
  currency          VARCHAR(3) NOT NULL DEFAULT 'USD',
  exchange_rate     DECIMAL(18,6) DEFAULT 1,
  reference         VARCHAR(255),
  description       TEXT,
  transaction_date  DATE NOT NULL,
  status            VARCHAR(50) NOT NULL DEFAULT 'PENDING',
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

CREATE TABLE cash_flow_forecasts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  company_id        UUID,
  forecast_date     DATE NOT NULL,
  projected_inflow  DECIMAL(18,2) DEFAULT 0,
  projected_outflow DECIMAL(18,2) DEFAULT 0,
  net_forecast      DECIMAL(18,2) DEFAULT 0,
  -- audit
  created_by        UUID,
  updated_by        UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tt_account  ON treasury_transactions(bank_account_id);
CREATE INDEX idx_tt_tenant   ON treasury_transactions(tenant_id);
CREATE INDEX idx_tt_date     ON treasury_transactions(transaction_date);
CREATE INDEX idx_tt_status   ON treasury_transactions(status);
