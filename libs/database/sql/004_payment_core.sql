-- ============================================================================
-- 004_payment_core.sql
-- ============================================================================
-- Payment requests and provider logs.
-- Depends on: 001_base_schema.sql
-- ============================================================================

CREATE TABLE payment_requests (
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

    request_no      varchar(50) NOT NULL,
    payment_type    varchar(50) NOT NULL,
    amount          numeric(18,2) NOT NULL,
    currency        varchar(3) DEFAULT 'USD',
    from_account    varchar,
    to_account      varchar,
    beneficiary_name varchar,
    reference       varchar,
    narration       text,
    idempotency_key varchar UNIQUE,
    status          varchar(50) DEFAULT 'DRAFT',
    provider_code   varchar(50),
    provider_ref    varchar,
    completed_at    timestamptz
);

CREATE INDEX idx_payment_requests_request_no ON payment_requests(request_no);
CREATE INDEX idx_payment_requests_status ON payment_requests(status);
CREATE INDEX idx_payment_requests_tenant_id ON payment_requests(tenant_id);
CREATE INDEX idx_payment_requests_is_deleted ON payment_requests(is_deleted);

-- ============================================================================
-- payment_provider_logs
-- ============================================================================
CREATE TABLE payment_provider_logs (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_request_id uuid NOT NULL,
    provider_code   varchar(50) NOT NULL,
    request_payload jsonb,
    response_payload jsonb,
    status          varchar(50) NOT NULL,
    provider_ref    varchar,
    error_message   text,
    created_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_provider_logs_payment_request_id ON payment_provider_logs(payment_request_id);
CREATE INDEX idx_provider_logs_provider_code ON payment_provider_logs(provider_code);

ALTER TABLE payment_provider_logs
    ADD CONSTRAINT fk_provider_logs_payment_request
    FOREIGN KEY (payment_request_id) REFERENCES payment_requests(id);
