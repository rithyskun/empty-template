-- ============================================================================
-- 003_audit_core.sql
-- ============================================================================
-- Audit logs.
-- Depends on: 001_base_schema.sql
-- ============================================================================

CREATE TABLE audit_logs (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid,
    company_id      uuid,
    branch_id       uuid,
    created_by      uuid,
    updated_by      uuid,
    approved_by     uuid,
    approved_at     timestamptz,
    workflow_instance_id uuid,
    trace_id        varchar,
    is_deleted      boolean DEFAULT false,
    deleted_at      timestamptz,
    deleted_by      uuid,
    version         integer DEFAULT 1,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now(),

    action          audit_action NOT NULL,
    entity_type     audit_entity_type NOT NULL,
    entity_id       uuid NOT NULL,
    previous_values jsonb,
    new_values      jsonb NOT NULL,
    metadata        jsonb,
    performed_by    uuid NOT NULL,
    performed_at    timestamptz NOT NULL,
    source_ip       varchar(255),
    correlation_id  varchar(100),
    user_agent      varchar(255),
    description     text
);

CREATE INDEX idx_audit_logs_tenant_entity
    ON audit_logs(tenant_id, entity_type, entity_id);
CREATE INDEX idx_audit_logs_tenant_action
    ON audit_logs(tenant_id, action);
CREATE INDEX idx_audit_logs_performed_at
    ON audit_logs(performed_at);
CREATE INDEX idx_audit_logs_is_deleted
    ON audit_logs(is_deleted);
