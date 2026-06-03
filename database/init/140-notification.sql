-- ============================================================
-- Notification Service
-- ============================================================

CREATE TABLE notification_templates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  code              VARCHAR(100) NOT NULL,
  name              VARCHAR(255) NOT NULL,
  channel           VARCHAR(20) NOT NULL,  -- EMAIL, SMS, PUSH, IN_APP
  subject           VARCHAR(255),
  body_template     TEXT NOT NULL,
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
  UNIQUE(tenant_id, code)
);

CREATE TABLE notifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  company_id        UUID,
  branch_id         UUID,
  recipient_id      UUID,
  recipient_email   VARCHAR(255),
  recipient_phone   VARCHAR(50),
  channel           VARCHAR(20) NOT NULL,
  title             VARCHAR(255),
  body              TEXT NOT NULL,
  template_code     VARCHAR(100),
  template_data     JSONB,
  reference_type    VARCHAR(100),
  reference_id      UUID,
  status            VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  sent_at           TIMESTAMPTZ,
  read_at           TIMESTAMPTZ,
  error_message     TEXT,
  -- audit
  created_by        UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted        BOOLEAN DEFAULT false,
  deleted_at        TIMESTAMPTZ,
  deleted_by        UUID,
  version           INTEGER DEFAULT 0
);

CREATE INDEX idx_n_status     ON notifications(status);
CREATE INDEX idx_n_recipient  ON notifications(recipient_id);
CREATE INDEX idx_n_reference  ON notifications(reference_type, reference_id);
CREATE INDEX idx_n_tenant     ON notifications(tenant_id);
CREATE INDEX idx_n_created    ON notifications(created_at);
