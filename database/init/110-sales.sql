-- ============================================================
-- Sales Service
-- ============================================================

CREATE TABLE sales_orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  company_id        UUID,
  branch_id         UUID,
  so_no             VARCHAR(50) NOT NULL,
  customer_id       UUID NOT NULL,
  customer_name     VARCHAR(255),
  order_date        DATE NOT NULL,
  delivery_date     DATE,
  total_amount      DECIMAL(18,2) NOT NULL,
  currency          VARCHAR(3) NOT NULL DEFAULT 'USD',
  status            VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
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

CREATE TABLE sales_order_lines (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  so_id             UUID REFERENCES sales_orders(id),
  item_id           UUID,
  item_name         VARCHAR(255),
  quantity          DECIMAL(18,2) NOT NULL,
  unit_price        DECIMAL(18,2) NOT NULL,
  total_price       DECIMAL(18,2) NOT NULL,
  delivered_qty     DECIMAL(18,2) DEFAULT 0,
  -- audit
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE deliveries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  company_id        UUID,
  branch_id         UUID,
  delivery_no       VARCHAR(50) NOT NULL,
  so_id             UUID REFERENCES sales_orders(id),
  delivery_date     DATE NOT NULL,
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

CREATE TABLE ar_invoices (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  company_id        UUID,
  branch_id         UUID,
  invoice_no        VARCHAR(50) NOT NULL,
  so_id             UUID REFERENCES sales_orders(id),
  customer_id       UUID NOT NULL,
  invoice_date      DATE NOT NULL,
  due_date          DATE NOT NULL,
  total_amount      DECIMAL(18,2) NOT NULL,
  paid_amount       DECIMAL(18,2) DEFAULT 0,
  balance           DECIMAL(18,2) DEFAULT 0,
  status            VARCHAR(50) NOT NULL DEFAULT 'PENDING',
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

CREATE INDEX idx_so_tenant   ON sales_orders(tenant_id);
CREATE INDEX idx_so_status   ON sales_orders(status);
CREATE INDEX idx_so_customer ON sales_orders(customer_id);
CREATE INDEX idx_sol_so      ON sales_order_lines(so_id);
CREATE INDEX idx_ari_customer ON ar_invoices(customer_id);
CREATE INDEX idx_ari_status   ON ar_invoices(status);
