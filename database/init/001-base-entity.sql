-- Base entity columns pattern — every table inherits this structure.
-- Each migration below includes these columns inline per TypeORM convention
-- rather than using table inheritance, for clarity and portability.

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
