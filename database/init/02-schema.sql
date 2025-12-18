-- ============================================================================
-- CALL SHEET CONNECTOR - ENTERPRISE DATABASE SCHEMA
-- ============================================================================
-- Design Principles:
-- 1. Third Normal Form (3NF) with strategic denormalization
-- 2. UUID primary keys for distributed systems compatibility
-- 3. Soft deletes for audit trail
-- 4. Timestamps on all tables
-- 5. Multi-tenancy ready (organization-based isolation)
-- 6. Full audit logging
-- 7. Proper foreign key constraints with ON DELETE policies
-- 8. Strategic indexing for common query patterns
-- ============================================================================

-- ============================================================================
-- CORE TABLES: Multi-tenancy & User Management
-- ============================================================================

-- Organizations (tenants)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_organizations_slug ON organizations(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_organizations_active ON organizations(is_active) WHERE deleted_at IS NULL;

-- Users (linked to auth provider like Supabase Auth)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id VARCHAR(255) UNIQUE NOT NULL, -- External auth provider ID
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email CITEXT NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'member', -- admin, member, viewer
    preferences JSONB DEFAULT '{}',
    last_login_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_users_email_org ON users(organization_id, email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_organization ON users(organization_id) WHERE deleted_at IS NULL;

-- ============================================================================
-- PRODUCTION MANAGEMENT
-- ============================================================================

-- Productions (projects/shows)
CREATE TABLE productions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50), -- Production code (e.g., "PILOT_S1")
    description TEXT,
    production_company VARCHAR(255),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active', -- active, completed, archived
    settings JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_productions_org ON productions(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_productions_name ON productions(organization_id, name) WHERE deleted_at IS NULL;
CREATE INDEX idx_productions_status ON productions(organization_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_productions_created ON productions(created_at DESC);

-- ============================================================================
-- CALL SHEET UPLOADS & PROCESSING
-- ============================================================================

-- Upload jobs (call sheet processing)
CREATE TABLE uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_id UUID REFERENCES productions(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    filename VARCHAR(500) NOT NULL,
    file_path TEXT, -- Storage path (S3, Supabase Storage, etc.)
    file_size INTEGER,
    file_type VARCHAR(100),
    original_content_hash VARCHAR(64), -- SHA-256 for deduplication
    
    -- Processing status
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed, cancelled
    processing_started_at TIMESTAMPTZ,
    processing_completed_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Extraction results
    extraction_result JSONB, -- Full AI extraction result
    contacts_extracted INTEGER DEFAULT 0,
    emergency_contacts_extracted INTEGER DEFAULT 0,
    locations_extracted INTEGER DEFAULT 0,
    
    -- Metadata
    shoot_date DATE, -- Extracted from call sheet
    call_sheet_number VARCHAR(50), -- e.g., "Day 1", "Shoot Day 15"
    
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_uploads_production ON uploads(production_id);
CREATE INDEX idx_uploads_org ON uploads(organization_id);
CREATE INDEX idx_uploads_status ON uploads(organization_id, status);
CREATE INDEX idx_uploads_created ON uploads(created_at DESC);
CREATE INDEX idx_uploads_hash ON uploads(original_content_hash);

-- ============================================================================
-- CONTACT MANAGEMENT
-- ============================================================================

-- Departments (normalized lookup table)
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20), -- Short code (e.g., "AD", "CAM", "PROD")
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_departments_org_name ON departments(organization_id, name);

-- Insert default departments
INSERT INTO departments (organization_id, name, code, sort_order) VALUES
    (NULL, 'Production', 'PROD', 1),
    (NULL, 'Assistant Director', 'AD', 2),
    (NULL, 'Camera', 'CAM', 3),
    (NULL, 'Sound', 'SND', 4),
    (NULL, 'Grip', 'GRIP', 5),
    (NULL, 'Electric', 'ELEC', 6),
    (NULL, 'Art Department', 'ART', 7),
    (NULL, 'Wardrobe', 'WARD', 8),
    (NULL, 'Hair & Makeup', 'HMU', 9),
    (NULL, 'Transportation', 'TRANS', 10),
    (NULL, 'Catering', 'CAT', 11),
    (NULL, 'Locations', 'LOC', 12),
    (NULL, 'Cast', 'CAST', 13),
    (NULL, 'Stunts', 'STNT', 14),
    (NULL, 'VFX', 'VFX', 15),
    (NULL, 'Post Production', 'POST', 16),
    (NULL, 'Other', 'OTH', 99);

-- Contacts (extracted from call sheets)
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    production_id UUID REFERENCES productions(id) ON DELETE CASCADE,
    upload_id UUID REFERENCES uploads(id) ON DELETE SET NULL,
    
    -- Core contact info
    name VARCHAR(255) NOT NULL,
    email CITEXT,
    phone VARCHAR(50),
    phone_secondary VARCHAR(50),
    
    -- Role/Position
    role VARCHAR(255),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    department_raw VARCHAR(100), -- Original extracted department
    
    -- Additional info
    company VARCHAR(255),
    notes TEXT,
    
    -- Call sheet specific
    call_time TIME,
    wrap_time TIME,
    location VARCHAR(255),
    
    -- Source tracking
    source_file VARCHAR(500),
    extraction_confidence DECIMAL(3,2), -- 0.00 to 1.00
    
    -- Deduplication
    is_primary BOOLEAN DEFAULT true, -- For merged duplicates
    merged_into_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Indexes for common queries
CREATE INDEX idx_contacts_org ON contacts(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_production ON contacts(production_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_upload ON contacts(upload_id);
CREATE INDEX idx_contacts_department ON contacts(department_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_email ON contacts(organization_id, email) WHERE deleted_at IS NULL AND email IS NOT NULL;
CREATE INDEX idx_contacts_phone ON contacts(organization_id, phone) WHERE deleted_at IS NULL AND phone IS NOT NULL;

-- Full-text search on contact names
CREATE INDEX idx_contacts_name_search ON contacts USING gin(name gin_trgm_ops) WHERE deleted_at IS NULL;

-- ============================================================================
-- EMERGENCY CONTACTS
-- ============================================================================

CREATE TABLE emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    production_id UUID REFERENCES productions(id) ON DELETE CASCADE,
    upload_id UUID REFERENCES uploads(id) ON DELETE SET NULL,
    
    contact_type VARCHAR(100) NOT NULL, -- e.g., "Emergency Services", "Hospital", "Police"
    name VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    notes TEXT,
    
    is_default BOOLEAN DEFAULT false, -- Default emergency contact for production
    priority INTEGER DEFAULT 0, -- Order of importance
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_emergency_contacts_production ON emergency_contacts(production_id);
CREATE INDEX idx_emergency_contacts_org ON emergency_contacts(organization_id);

-- ============================================================================
-- LOCATIONS
-- ============================================================================

CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    production_id UUID REFERENCES productions(id) ON DELETE CASCADE,
    upload_id UUID REFERENCES uploads(id) ON DELETE SET NULL,
    
    name VARCHAR(255) NOT NULL,
    location_type VARCHAR(50), -- basecamp, set, unit_base, parking, catering
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    
    -- Contact info
    phone VARCHAR(50),
    contact_name VARCHAR(255),
    contact_email CITEXT,
    
    -- Coordinates (for mapping)
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_locations_production ON locations(production_id);
CREATE INDEX idx_locations_org ON locations(organization_id);
CREATE INDEX idx_locations_type ON locations(production_id, location_type);

-- ============================================================================
-- AUDIT LOGGING
-- ============================================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Action details
    action VARCHAR(50) NOT NULL, -- create, update, delete, export, import
    entity_type VARCHAR(100) NOT NULL, -- production, contact, upload, etc.
    entity_id UUID NOT NULL,
    
    -- Change data
    old_values JSONB,
    new_values JSONB,
    
    -- Request context
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- Partition audit logs by month for performance
-- (In production, you'd set up partitioning)

-- ============================================================================
-- API KEYS (for integrations)
-- ============================================================================

CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of the key
    key_prefix VARCHAR(10) NOT NULL, -- First 10 chars for identification
    
    scopes TEXT[] DEFAULT '{}', -- read, write, admin
    rate_limit INTEGER DEFAULT 1000, -- Requests per hour
    
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_keys_org ON api_keys(organization_id) WHERE is_active = true;
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash) WHERE is_active = true;

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update_updated_at trigger to all tables with updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_productions_updated_at BEFORE UPDATE ON productions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_uploads_updated_at BEFORE UPDATE ON uploads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_emergency_contacts_updated_at BEFORE UPDATE ON emergency_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Production summary view
CREATE VIEW production_summaries AS
SELECT 
    p.id,
    p.organization_id,
    p.name,
    p.code,
    p.status,
    p.created_at,
    COUNT(DISTINCT u.id) FILTER (WHERE u.status = 'completed') AS completed_uploads,
    COUNT(DISTINCT u.id) FILTER (WHERE u.status = 'failed') AS failed_uploads,
    COUNT(DISTINCT c.id) AS total_contacts,
    COUNT(DISTINCT e.id) AS total_emergency_contacts,
    COUNT(DISTINCT l.id) AS total_locations
FROM productions p
LEFT JOIN uploads u ON u.production_id = p.id
LEFT JOIN contacts c ON c.production_id = p.id AND c.deleted_at IS NULL
LEFT JOIN emergency_contacts e ON e.production_id = p.id
LEFT JOIN locations l ON l.production_id = p.id
WHERE p.deleted_at IS NULL
GROUP BY p.id;

-- ============================================================================
-- COMMENTS (for documentation)
-- ============================================================================

COMMENT ON TABLE organizations IS 'Multi-tenant organizations';
COMMENT ON TABLE users IS 'User accounts linked to external auth provider';
COMMENT ON TABLE productions IS 'Productions/projects within an organization';
COMMENT ON TABLE uploads IS 'Call sheet upload jobs and processing status';
COMMENT ON TABLE contacts IS 'Extracted contacts from call sheets';
COMMENT ON TABLE departments IS 'Normalized department lookup table';
COMMENT ON TABLE emergency_contacts IS 'Emergency contacts extracted from call sheets';
COMMENT ON TABLE locations IS 'Locations extracted from call sheets';
COMMENT ON TABLE audit_logs IS 'Audit trail for all data changes';
COMMENT ON TABLE api_keys IS 'API keys for external integrations';

COMMENT ON COLUMN contacts.extraction_confidence IS 'AI confidence score for extraction accuracy (0.00-1.00)';
COMMENT ON COLUMN contacts.is_primary IS 'Primary record when duplicates are merged';
COMMENT ON COLUMN uploads.extraction_result IS 'Full JSON result from AI extraction';

