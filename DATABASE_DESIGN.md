# Database Design Principles

## Overview

This document outlines the core database design principles implemented in the Call Sheet Connector system to ensure enterprise-grade quality and scalability.

---

## 1. Database Choice: PostgreSQL

### Why PostgreSQL?

| Feature | Benefit |
|---------|---------|
| **JSONB** | Store flexible extraction results without schema changes |
| **Full-text Search** | Fast contact searching with trigram support |
| **ACID Compliance** | Data integrity guaranteed |
| **Scalability** | Read replicas, partitioning, connection pooling |
| **Extensions** | UUID, pg_trgm, citext for enterprise features |
| **Maturity** | Battle-tested in production at scale |

### Alternatives Considered

- **MongoDB**: Good for unstructured data, but our data is mostly structured
- **MySQL**: Lacks JSONB flexibility and advanced search features
- **SQLite**: Not suitable for multi-user production systems

---

## 2. Core Design Principles

### 2.1 Normalization (Third Normal Form)

```
GOOD:
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ productions │────<│  contacts   │>────│ departments │
└─────────────┘     └─────────────┘     └─────────────┘

BAD (denormalized):
┌───────────────────────────────────────────────────┐
│ contacts                                          │
│ - name, email, phone, department_name,            │
│   department_code, production_name, company...    │
└───────────────────────────────────────────────────┘
```

**Rules:**
- Each table represents one entity
- No repeating groups
- No partial dependencies
- No transitive dependencies
- Strategic denormalization only for read-heavy operations

### 2.2 UUID Primary Keys

```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
```

**Benefits:**
- Globally unique across distributed systems
- No auto-increment collisions during merges
- Safe to expose in APIs (not guessable)
- Database-agnostic

### 2.3 Soft Deletes

```sql
deleted_at TIMESTAMPTZ  -- NULL means not deleted
```

**Benefits:**
- Audit trail preserved
- Easy recovery
- Referential integrity maintained
- Historical analysis possible

### 2.4 Timestamps on All Tables

```sql
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
```

**Benefits:**
- Audit trail
- Debugging
- Analytics
- Cache invalidation
- Sync operations

### 2.5 Multi-Tenancy

```
┌──────────────────┐
│  organizations   │  <-- Tenant isolation
├──────────────────┤
│  └── users       │
│  └── productions │
│  └── contacts    │
│  └── uploads     │
└──────────────────┘
```

**Implementation:**
- `organization_id` foreign key on all tenant-scoped tables
- Row-Level Security (RLS) for automatic filtering
- Indexes include organization_id for query performance

---

## 3. Data Integrity

### 3.1 Foreign Key Constraints

```sql
-- Cascade delete when parent is removed
production_id UUID REFERENCES productions(id) ON DELETE CASCADE

-- Set null when parent is removed (preserve data)
created_by UUID REFERENCES users(id) ON DELETE SET NULL
```

### 3.2 Check Constraints

```sql
-- Status must be valid value
CHECK (status IN ('pending', 'processing', 'completed', 'failed'))

-- Confidence score must be between 0 and 1
extraction_confidence DECIMAL(3,2) CHECK (extraction_confidence >= 0 AND extraction_confidence <= 1)
```

### 3.3 Unique Constraints

```sql
-- Organization slug must be unique
slug VARCHAR(100) UNIQUE NOT NULL

-- Email unique per organization
CREATE UNIQUE INDEX idx_users_email_org ON users(organization_id, email) 
WHERE deleted_at IS NULL;
```

### 3.4 NOT NULL Constraints

```sql
-- Required fields must have values
name VARCHAR(255) NOT NULL
created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
```

---

## 4. Indexing Strategy

### 4.1 Primary Indexes

```sql
-- Every table has a primary key index
PRIMARY KEY (id)
```

### 4.2 Foreign Key Indexes

```sql
-- All foreign keys should be indexed
CREATE INDEX idx_contacts_production ON contacts(production_id);
CREATE INDEX idx_contacts_organization ON contacts(organization_id);
```

### 4.3 Composite Indexes (Query Patterns)

```sql
-- Common query: "contacts by org and email"
CREATE INDEX idx_contacts_email ON contacts(organization_id, email) 
WHERE deleted_at IS NULL AND email IS NOT NULL;
```

### 4.4 Full-Text Search Indexes

```sql
-- Trigram index for fuzzy name search
CREATE INDEX idx_contacts_name_search ON contacts 
USING gin(name gin_trgm_ops) 
WHERE deleted_at IS NULL;
```

### 4.5 Partial Indexes

```sql
-- Only index active records
CREATE INDEX idx_users_active ON users(organization_id) 
WHERE deleted_at IS NULL AND is_active = true;
```

---

## 5. Scalability Patterns

### 5.1 Read Replicas

```
┌─────────┐     ┌─────────┐
│ Primary │────>│ Replica │  (Read-only queries)
│   DB    │     │   DB    │
└─────────┘     └─────────┘
      │
      v
  (Writes)
```

**Implementation:**
- Route read queries to replicas
- Keep writes on primary
- Automatic failover

### 5.2 Connection Pooling

```
App Server ──┬── Pool ──── DB
App Server ──┤
App Server ──┘
```

**Tools:**
- PgBouncer
- Supabase connection pooler
- Application-level pooling

### 5.3 Table Partitioning

```sql
-- Partition audit logs by month
CREATE TABLE audit_logs (
    ...
) PARTITION BY RANGE (created_at);

CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

**Use cases:**
- Time-series data (audit logs)
- Multi-tenant data (by organization)
- High-volume tables

### 5.4 Query Optimization

```sql
-- Use EXPLAIN ANALYZE to understand query plans
EXPLAIN ANALYZE
SELECT * FROM contacts 
WHERE organization_id = '...' 
AND name ILIKE '%john%';

-- Add indexes based on slow query patterns
CREATE INDEX CONCURRENTLY idx_contacts_name_search ON contacts 
USING gin(name gin_trgm_ops);
```

---

## 6. Security

### 6.1 Row-Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their organization's data
CREATE POLICY org_isolation ON contacts
    FOR ALL
    USING (organization_id = current_setting('app.organization_id')::uuid);
```

### 6.2 Sensitive Data Handling

```sql
-- Hash API keys (never store plain text)
key_hash VARCHAR(64) NOT NULL  -- SHA-256

-- Use citext for case-insensitive email
email CITEXT NOT NULL
```

### 6.3 Audit Logging

```sql
-- Log all changes for compliance
CREATE TABLE audit_logs (
    action VARCHAR(50) NOT NULL,  -- create, update, delete
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_id UUID,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. Schema Evolution

### 7.1 Migration Strategy

```
migrations/
├── 001_initial_schema.sql
├── 002_add_departments.sql
├── 003_add_audit_logs.sql
└── 004_add_api_keys.sql
```

**Rules:**
- Never modify existing migrations
- New migrations only add changes
- Test migrations on staging first
- Use transactions for safety

### 7.2 Backward Compatibility

```sql
-- Add new columns with defaults (non-breaking)
ALTER TABLE contacts ADD COLUMN extraction_confidence DECIMAL(3,2) DEFAULT 0.0;

-- Deprecate columns gradually (not immediately drop)
-- 1. Stop writing to column
-- 2. Remove from application code
-- 3. Drop column in later migration
```

---

## 8. Performance Considerations

### 8.1 Avoid N+1 Queries

```sql
-- BAD: N+1 queries
SELECT * FROM productions;
-- Then for each production:
SELECT * FROM contacts WHERE production_id = ?;

-- GOOD: Single query with JOIN
SELECT p.*, c.*
FROM productions p
LEFT JOIN contacts c ON c.production_id = p.id
WHERE p.organization_id = ?;
```

### 8.2 Use JSONB Wisely

```sql
-- GOOD: Store flexible extraction results
extraction_result JSONB

-- BAD: Store frequently queried data in JSONB
-- Use proper columns instead for filtering/indexing
```

### 8.3 Batch Operations

```sql
-- BAD: Insert one at a time
INSERT INTO contacts (name) VALUES ('John');
INSERT INTO contacts (name) VALUES ('Jane');

-- GOOD: Batch insert
INSERT INTO contacts (name) VALUES ('John'), ('Jane'), ('Bob');
```

---

## 9. Monitoring

### Key Metrics to Track

1. **Query Performance**
   - Slow query log
   - Query plan analysis
   - Index usage statistics

2. **Connection Health**
   - Active connections
   - Connection pool utilization
   - Wait times

3. **Storage**
   - Table sizes
   - Index sizes
   - Disk usage growth

4. **Replication**
   - Replica lag
   - Replication status

---

## 10. Checklist for New Tables

- [ ] UUID primary key
- [ ] created_at / updated_at timestamps
- [ ] deleted_at for soft deletes (if needed)
- [ ] organization_id for multi-tenancy
- [ ] Foreign key constraints with appropriate ON DELETE
- [ ] Indexes on foreign keys
- [ ] Indexes for common query patterns
- [ ] Comments documenting purpose
- [ ] Migration file created
- [ ] RLS policy (if needed)

