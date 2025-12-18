-- Enable required PostgreSQL extensions

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Full-text search with trigram support
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Case-insensitive text type
CREATE EXTENSION IF NOT EXISTS "citext";

-- Cryptographic functions (for hashing, etc.)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

