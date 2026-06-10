-- ============================================================================
-- 007_advance_core.sql
-- ============================================================================
-- Salary advance requests and repayments.
-- Depends on: 001_base_schema.sql
-- ============================================================================

CREATE TABLE advance_requests (
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
    employee_id     uuid NOT NULL,
    amount          numeric(18,2) NOT NULL,
    currency        varchar(3) DEFAULT 'USD',
    reason          text,
    repayment_terms integer DEFAULT 1,
    status          varchar(50) DEFAULT 'DRAFT',
    disbursed_at    timestamptz
);

CREATE INDEX idx_advance_requests_request_no ON advance_requests(request_no);
CREATE INDEX idx_advance_requests_employee_id ON advance_requests(employee_id);
CREATE INDEX idx_advance_requests_status ON advance_requests(status);
CREATE INDEX idx_advance_requests_is_deleted ON advance_requests(is_deleted);

-- ============================================================================
-- advance_repayments
-- ============================================================================
CREATE TABLE advance_repayments (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    advance_request_id uuid NOT NULL,
    installment_no  integer NOT NULL,
    due_date        date NOT NULL,
    amount          numeric(18,2) NOT NULL,
    paid            boolean DEFAULT false,
    paid_at         timestamptz,
    payroll_run_id  uuid,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_advance_repayments_advance_request_id ON advance_repayments(advance_request_id);
CREATE INDEX idx_advance_repayments_paid ON advance_repayments(paid);

ALTER TABLE advance_repayments
    ADD CONSTRAINT fk_advance_repayments_request
    FOREIGN KEY (advance_request_id) REFERENCES advance_requests(id);
