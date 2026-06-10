-- ============================================================================
-- 008_workflow_core.sql
-- ============================================================================
-- Workflow definitions, instances, and stage tracking.
-- Depends on: 001_base_schema.sql
-- ============================================================================

CREATE TABLE workflow_definitions (
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

    name            varchar(255) NOT NULL,
    code            varchar(100) NOT NULL,
    description     text
);

CREATE INDEX idx_workflow_definitions_code ON workflow_definitions(code);
CREATE INDEX idx_workflow_definitions_is_deleted ON workflow_definitions(is_deleted);

-- ============================================================================
-- workflow_stage_definitions
-- ============================================================================
CREATE TABLE workflow_stage_definitions (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_definition_id uuid NOT NULL,
    stage_order     integer NOT NULL,
    stage_type      varchar(50) NOT NULL,
    role_required   varchar[] NOT NULL,
    deadline_hours  integer DEFAULT 0,
    auto_escalate   boolean DEFAULT false,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_workflow_stage_definitions_wd_id
    ON workflow_stage_definitions(workflow_definition_id);

ALTER TABLE workflow_stage_definitions
    ADD CONSTRAINT fk_wsd_workflow_definition
    FOREIGN KEY (workflow_definition_id) REFERENCES workflow_definitions(id);

-- ============================================================================
-- workflow_instances
-- ============================================================================
CREATE TABLE workflow_instances (
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

    workflow_code   varchar(100) NOT NULL,
    entity_type     varchar(100) NOT NULL,
    entity_id       uuid NOT NULL,
    status          varchar(50) DEFAULT 'DRAFT',
    current_stage   integer DEFAULT 0
);

CREATE INDEX idx_workflow_instances_workflow_code ON workflow_instances(workflow_code);
CREATE INDEX idx_workflow_instances_entity ON workflow_instances(entity_type, entity_id);
CREATE INDEX idx_workflow_instances_status ON workflow_instances(status);
CREATE INDEX idx_workflow_instances_is_deleted ON workflow_instances(is_deleted);

-- ============================================================================
-- workflow_stages
-- ============================================================================
CREATE TABLE workflow_stages (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_instance_id uuid NOT NULL,
    stage_order     integer NOT NULL,
    stage_type      varchar(50) NOT NULL,
    assigned_role   varchar(50),
    assigned_user   uuid,
    status          varchar(50) DEFAULT 'PENDING',
    comment         text,
    acted_at        timestamptz,
    acted_by        uuid,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_workflow_stages_instance_id ON workflow_stages(workflow_instance_id);
CREATE INDEX idx_workflow_stages_status ON workflow_stages(status);

ALTER TABLE workflow_stages
    ADD CONSTRAINT fk_workflow_stages_instance
    FOREIGN KEY (workflow_instance_id) REFERENCES workflow_instances(id);
