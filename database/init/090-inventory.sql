-- ============================================================
-- Inventory Service
-- ============================================================

CREATE TABLE inventory_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  company_id        UUID,
  branch_id         UUID,
  sku               VARCHAR(100) NOT NULL,
  name              VARCHAR(255) NOT NULL,
  description       TEXT,
  category          VARCHAR(100),
  unit_of_measure   VARCHAR(50) NOT NULL,
  quantity          DECIMAL(18,2) DEFAULT 0,
  unit_cost         DECIMAL(18,2) DEFAULT 0,
  total_value       DECIMAL(18,2) DEFAULT 0,
  valuation_method  VARCHAR(10) NOT NULL DEFAULT 'FIFO',  -- FIFO, AVCO
  reorder_level     DECIMAL(18,2) DEFAULT 0,
  is_active         BOOLEAN DEFAULT true,
  -- audit
  created_by        UUID,
  updated_by        UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted        BOOLEAN DEFAULT false,
  deleted_at        TIMESTAMPTZ,
  deleted_by        UUID,
  version           INTEGER DEFAULT 0,
  UNIQUE(tenant_id, sku)
);

CREATE TABLE stock_movements (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  company_id        UUID,
  branch_id         UUID,
  item_id           UUID REFERENCES inventory_items(id),
  movement_type     VARCHAR(20) NOT NULL,  -- IN, OUT, ADJUSTMENT
  quantity          DECIMAL(18,2) NOT NULL,
  unit_cost         DECIMAL(18,2) NOT NULL,
  total_cost        DECIMAL(18,2) NOT NULL,
  reference_type    VARCHAR(100),
  reference_id      UUID,
  description       TEXT,
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

CREATE INDEX idx_ii_tenant ON inventory_items(tenant_id);
CREATE INDEX idx_ii_sku    ON inventory_items(sku);
CREATE INDEX idx_sm_item   ON stock_movements(item_id);
CREATE INDEX idx_sm_type   ON stock_movements(movement_type);
