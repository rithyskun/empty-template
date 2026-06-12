-- ============================================================================
-- 009_advance_travel_support.sql
-- ============================================================================
-- Adds travel-advance fields to advance_requests and extends
-- advance_request_items to support both department line-items
-- and travel allowance rows.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- advance_requests: add type enum + travel-specific fields
-- ---------------------------------------------------------------------------
CREATE TYPE advance_request_type AS ENUM ('DEPARTMENT', 'TRAVEL');

ALTER TABLE advance_requests
    ADD COLUMN type advance_request_type DEFAULT 'DEPARTMENT';

ALTER TABLE advance_requests
    ADD COLUMN country               varchar(100),
    ADD COLUMN city_province         varchar(100),
    ADD COLUMN travel_from           varchar(100),
    ADD COLUMN travel_to             varchar(100),
    ADD COLUMN number_of_days        integer,
    ADD COLUMN mission_purpose       text,
    ADD COLUMN payroll_account_number varchar(50),
    ADD COLUMN remarks               text;

CREATE INDEX idx_advance_requests_type ON advance_requests(type);

-- ---------------------------------------------------------------------------
-- advance_request_items: extend for travel allowance rows
-- ---------------------------------------------------------------------------
ALTER TABLE advance_request_items
    ADD COLUMN item_type      varchar(50),
    ADD COLUMN number_of_days integer,
    ADD COLUMN rate           numeric(18,2);

-- description is still used for department advances; keep nullable for travel
ALTER TABLE advance_request_items
    ALTER COLUMN description DROP NOT NULL;

CREATE INDEX idx_advance_request_items_type ON advance_request_items(item_type);
