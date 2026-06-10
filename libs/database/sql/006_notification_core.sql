-- ============================================================================
-- 006_notification_core.sql
-- ============================================================================
-- Notification templates and queued/sent notifications.
-- Depends on: 001_base_schema.sql
-- ============================================================================

CREATE TABLE notification_templates (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid,
    code            varchar(100) NOT NULL,
    name            varchar(255) NOT NULL,
    channel         varchar(20) NOT NULL,
    subject         varchar,
    body_template   text NOT NULL,
    is_active       boolean DEFAULT true,
    created_by      uuid,
    updated_by      uuid,
    is_deleted      boolean DEFAULT false,
    deleted_at      timestamptz,
    deleted_by      uuid,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now(),
    version         integer DEFAULT 1
);

CREATE INDEX idx_notification_templates_code ON notification_templates(code);
CREATE INDEX idx_notification_templates_channel ON notification_templates(channel);
CREATE INDEX idx_notification_templates_is_deleted ON notification_templates(is_deleted);

-- ============================================================================
-- notifications
-- ============================================================================
CREATE TABLE notifications (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid,
    company_id      uuid,
    branch_id       uuid,
    recipient_id    uuid,
    recipient_email varchar,
    recipient_phone varchar,
    channel         varchar(20) NOT NULL,
    title           varchar,
    body            text NOT NULL,
    template_code   varchar,
    template_data   jsonb,
    reference_type  varchar,
    reference_id    uuid,
    status          varchar(50) DEFAULT 'PENDING',
    sent_at         timestamptz,
    read_at         timestamptz,
    error_message   text,
    created_by      uuid,
    is_deleted      boolean DEFAULT false,
    deleted_at      timestamptz,
    deleted_by      uuid,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now(),
    version         integer DEFAULT 1
);

CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_reference ON notifications(reference_type, reference_id);
CREATE INDEX idx_notifications_is_deleted ON notifications(is_deleted);
