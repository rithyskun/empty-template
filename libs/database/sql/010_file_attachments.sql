-- ============================================================================
-- 010_file_attachments.sql
-- ============================================================================
-- Generic file attachment table for any entity type.
-- Supports local disk storage (extensible to S3/R2 later).
-- ============================================================================

CREATE TABLE file_attachments (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type     varchar(100) NOT NULL,
    entity_id       uuid NOT NULL,
    file_name       varchar(255) NOT NULL,
    original_name   varchar(255) NOT NULL,
    mime_type       varchar(100) NOT NULL,
    size            integer NOT NULL,
    storage_path    varchar(500) NOT NULL,
    storage_provider varchar(50) DEFAULT 'LOCAL',
    url             varchar(500),
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
    updated_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_file_attachments_entity ON file_attachments(entity_type, entity_id);
CREATE INDEX idx_file_attachments_tenant ON file_attachments(tenant_id);
