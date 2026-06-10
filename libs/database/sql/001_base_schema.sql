-- ============================================================================
-- 001_base_schema.sql
-- ============================================================================
-- Base enums and shared types used across all modules.
-- Must run before all other scripts.
-- ============================================================================

-- User lifecycle status (identity-core)
CREATE TYPE user_status AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE', 'REJECTED');

-- Audit actions (audit-core)
CREATE TYPE audit_action AS ENUM (
    'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT',
    'SUBMIT', 'CHECK', 'REVERSE', 'CANCEL', 'VIEW'
);

-- Audit entity types (audit-core)
CREATE TYPE audit_entity_type AS ENUM (
    'PAYMENT_REQUEST', 'SETTLEMENT_BATCH', 'JOURNAL_ENTRY',
    'PAYROLL_RUN', 'PAYSLIP', 'SALARY_ADVANCE', 'LOAN_APPLICATION',
    'LOAN_REPAYMENT', 'PURCHASE_ORDER', 'GOODS_RECEIPT_NOTE',
    'SALES_ORDER', 'INVOICE', 'USER', 'ROLE', 'PERMISSION',
    'WORKFLOW_INSTANCE', 'NOTIFICATION', 'RECONCILIATION_RUN',
    'INVENTORY_ITEM', 'STOCK_MOVEMENT', 'TREASURY_TRANSACTION',
    'POS_TRANSACTION', 'CONFIGURATION'
);
