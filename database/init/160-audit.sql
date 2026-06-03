-- ============================================================
-- Audit Log Service
-- ============================================================

CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID,
  company_id      UUID,
  branch_id       UUID,
  action          VARCHAR(50) NOT NULL,       -- CREATE, UPDATE, DELETE, APPROVE, etc.
  entity_type     VARCHAR(100) NOT NULL,      -- PAYMENT_REQUEST, SETTLEMENT_BATCH, etc.
  entity_id       UUID NOT NULL,
  previous_values JSONB,
  new_values      JSONB NOT NULL,
  metadata        JSONB,
  performed_by    UUID NOT NULL,
  performed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_ip       VARCHAR(255),
  correlation_id  VARCHAR(100),
  user_agent      VARCHAR(255),
  description     TEXT,
  -- audit (meta-audit)
  trace_id        VARCHAR(255),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted      BOOLEAN DEFAULT false,
  deleted_at      TIMESTAMPTZ,
  deleted_by      UUID,
  version         INTEGER DEFAULT 0
);

-- Indexes for audit query performance
CREATE INDEX idx_al_tenant_entity ON audit_logs(tenant_id, entity_type, entity_id);
CREATE INDEX idx_al_tenant_action ON audit_logs(tenant_id, action);
CREATE INDEX idx_al_performed_at  ON audit_logs(performed_at);
CREATE INDEX idx_al_performed_by  ON audit_logs(performed_by);
CREATE INDEX idx_al_correlation   ON audit_logs(correlation_id);
