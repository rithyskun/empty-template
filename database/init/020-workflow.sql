-- ============================================================
-- Workflow Engine
-- ============================================================

CREATE TABLE workflow_definitions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID,
  name            VARCHAR(255) NOT NULL,
  code            VARCHAR(100) NOT NULL,
  description     TEXT,
  -- audit
  created_by      UUID,
  updated_by      UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted      BOOLEAN DEFAULT false,
  deleted_at      TIMESTAMPTZ,
  deleted_by      UUID,
  version         INTEGER DEFAULT 0,
  UNIQUE(tenant_id, code)
);

CREATE TABLE workflow_stage_definitions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_definition_id UUID REFERENCES workflow_definitions(id),
  stage_order         INTEGER NOT NULL,
  stage_type          VARCHAR(50) NOT NULL,  -- MAKER, CHECKER, AUTHORIZER
  role_required       VARCHAR(50)[] NOT NULL,
  deadline_hours      INTEGER DEFAULT 0,
  auto_escalate       BOOLEAN DEFAULT false,
  -- audit
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE workflow_instances (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID,
  company_id      UUID,
  branch_id       UUID,
  workflow_code   VARCHAR(100) NOT NULL,
  entity_type     VARCHAR(100) NOT NULL,
  entity_id       UUID NOT NULL,
  status          VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  current_stage   INTEGER DEFAULT 0,
  -- audit
  created_by      UUID,
  updated_by      UUID,
  approved_by     UUID,
  approved_at     TIMESTAMPTZ,
  trace_id        VARCHAR(255),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted      BOOLEAN DEFAULT false,
  deleted_at      TIMESTAMPTZ,
  deleted_by      UUID,
  version         INTEGER DEFAULT 0
);

CREATE TABLE workflow_stages (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_instance_id UUID REFERENCES workflow_instances(id),
  stage_order         INTEGER NOT NULL,
  stage_type          VARCHAR(50) NOT NULL,
  assigned_role       VARCHAR(50),
  assigned_user       UUID,
  status              VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  comment             TEXT,
  acted_at            TIMESTAMPTZ,
  acted_by            UUID,
  -- audit
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_wi_entity   ON workflow_instances(entity_type, entity_id);
CREATE INDEX idx_wi_status   ON workflow_instances(status);
CREATE INDEX idx_wi_tenant   ON workflow_instances(tenant_id);
CREATE INDEX idx_ws_instance ON workflow_stages(workflow_instance_id);
