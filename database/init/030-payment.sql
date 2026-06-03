-- ============================================================
-- Payment Service
-- ============================================================

CREATE TABLE payment_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  company_id        UUID,
  branch_id         UUID,
  request_no        VARCHAR(50) NOT NULL,
  payment_type      VARCHAR(50) NOT NULL,
  amount            DECIMAL(18,2) NOT NULL,
  currency          VARCHAR(3) NOT NULL DEFAULT 'USD',
  from_account      VARCHAR(100),
  to_account        VARCHAR(100),
  beneficiary_name  VARCHAR(255),
  reference         VARCHAR(255),
  narration         TEXT,
  idempotency_key   VARCHAR(255) UNIQUE,
  status            VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  workflow_instance_id UUID,
  provider_code     VARCHAR(50),
  provider_ref      VARCHAR(255),
  completed_at      TIMESTAMPTZ,
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

CREATE TABLE payment_provider_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_request_id UUID REFERENCES payment_requests(id),
  provider_code     VARCHAR(50) NOT NULL,
  request_payload   JSONB,
  response_payload  JSONB,
  status            VARCHAR(50) NOT NULL,
  provider_ref      VARCHAR(255),
  error_message     TEXT,
  -- audit
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_pr_tenant   ON payment_requests(tenant_id);
CREATE INDEX idx_pr_status   ON payment_requests(status);
CREATE INDEX idx_pr_idem_key ON payment_requests(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX idx_prl_request ON payment_provider_logs(payment_request_id);
