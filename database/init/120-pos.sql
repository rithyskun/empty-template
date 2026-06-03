-- ============================================================
-- POS Service
-- ============================================================

CREATE TABLE pos_registers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  company_id        UUID,
  branch_id         UUID,
  register_name     VARCHAR(100) NOT NULL,
  location          VARCHAR(255),
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

CREATE TABLE pos_shifts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  company_id        UUID,
  branch_id         UUID,
  register_id       UUID REFERENCES pos_registers(id),
  opened_by         UUID NOT NULL,
  opened_at         TIMESTAMPTZ NOT NULL,
  closed_by         UUID,
  closed_at         TIMESTAMPTZ,
  opening_balance   DECIMAL(18,2) DEFAULT 0,
  closing_balance   DECIMAL(18,2),
  expected_balance  DECIMAL(18,2),
  difference        DECIMAL(18,2),
  status            VARCHAR(50) NOT NULL DEFAULT 'OPEN',
  -- audit
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pos_transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  company_id        UUID,
  branch_id         UUID,
  shift_id          UUID REFERENCES pos_shifts(id),
  register_id       UUID REFERENCES pos_registers(id),
  transaction_no    VARCHAR(50) NOT NULL,
  transaction_type  VARCHAR(20) NOT NULL,  -- SALE, REFUND, VOID
  total_amount      DECIMAL(18,2) NOT NULL,
  tax_amount        DECIMAL(18,2) DEFAULT 0,
  discount_amount   DECIMAL(18,2) DEFAULT 0,
  net_amount        DECIMAL(18,2) NOT NULL,
  payment_method    VARCHAR(50),
  customer_id       UUID,
  status            VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
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

CREATE TABLE pos_transaction_lines (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id    UUID REFERENCES pos_transactions(id),
  item_id           UUID,
  item_name         VARCHAR(255),
  quantity          DECIMAL(18,2) NOT NULL,
  unit_price        DECIMAL(18,2) NOT NULL,
  total_price       DECIMAL(18,2) NOT NULL,
  -- audit
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pt_shift   ON pos_transactions(shift_id);
CREATE INDEX idx_pt_tenant  ON pos_transactions(tenant_id);
CREATE INDEX idx_pt_date    ON pos_transactions(created_at);
CREATE INDEX idx_ps_register ON pos_shifts(register_id);
