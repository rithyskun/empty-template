-- ============================================================
-- Outbox Pattern (Event Bus)
-- ============================================================

CREATE TABLE outbox_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID,
  event_name      VARCHAR(255) NOT NULL,
  aggregate_id    VARCHAR(255) NOT NULL,
  aggregate_type  VARCHAR(100),
  payload         JSONB NOT NULL,
  published       BOOLEAN DEFAULT false,
  published_at    TIMESTAMPTZ,
  retry_count     INTEGER DEFAULT 0,
  -- audit
  trace_id        VARCHAR(255),
  created_by      UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted      BOOLEAN DEFAULT false,
  deleted_at      TIMESTAMPTZ,
  deleted_by      UUID,
  version         INTEGER DEFAULT 0
);

CREATE INDEX idx_oe_published  ON outbox_events(published) WHERE published = false;
CREATE INDEX idx_oe_event_name ON outbox_events(event_name);
CREATE INDEX idx_oe_aggregate  ON outbox_events(aggregate_id);
CREATE INDEX idx_oe_tenant     ON outbox_events(tenant_id);
CREATE INDEX idx_oe_created    ON outbox_events(created_at);
