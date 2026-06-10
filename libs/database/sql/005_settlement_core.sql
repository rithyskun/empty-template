-- ============================================================================
-- 005_settlement_core.sql
-- ============================================================================
-- Settlement batches and transactions.
-- Depends on: 001_base_schema.sql
-- ============================================================================

CREATE TABLE settlement_batches (
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

    batch_no        varchar(50) NOT NULL,
    settlement_type varchar(50) NOT NULL,
    total_amount    numeric(18,2) NOT NULL,
    currency        varchar(3) DEFAULT 'USD',
    scheduled_date  date,
    executed_at     timestamptz,
    status          varchar(50) DEFAULT 'PENDING'
);

CREATE INDEX idx_settlement_batches_batch_no ON settlement_batches(batch_no);
CREATE INDEX idx_settlement_batches_status ON settlement_batches(status);
CREATE INDEX idx_settlement_batches_tenant_id ON settlement_batches(tenant_id);
CREATE INDEX idx_settlement_batches_is_deleted ON settlement_batches(is_deleted);

-- ============================================================================
-- settlement_transactions
-- ============================================================================
CREATE TABLE settlement_transactions (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id        uuid NOT NULL,
    tenant_id       uuid,
    company_id      uuid,
    branch_id       uuid,
    employee_id     uuid,
    vendor_id       uuid,
    customer_id     uuid,
    amount          numeric(18,2) NOT NULL,
    currency        varchar(3) DEFAULT 'USD',
    payment_type    varchar(50) NOT NULL,
    account_number  varchar(100),
    reference       varchar,
    status          varchar(50) DEFAULT 'PENDING',
    payment_id      uuid,
    created_by      uuid,
    updated_by      uuid,
    is_deleted      boolean DEFAULT false,
    deleted_at      timestamptz,
    deleted_by      uuid,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now(),
    version         integer DEFAULT 1
);

CREATE INDEX idx_settlement_transactions_batch_id ON settlement_transactions(batch_id);
CREATE INDEX idx_settlement_transactions_status ON settlement_transactions(status);
CREATE INDEX idx_settlement_transactions_is_deleted ON settlement_transactions(is_deleted);

ALTER TABLE settlement_transactions
    ADD CONSTRAINT fk_settlement_transactions_batch
    FOREIGN KEY (batch_id) REFERENCES settlement_batches(id);
