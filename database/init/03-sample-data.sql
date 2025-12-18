-- ============================================================================
-- SAMPLE DATA FOR DEVELOPMENT
-- ============================================================================

-- Create a sample organization
INSERT INTO organizations (id, name, slug, settings) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Parrot Productions', 'parrot', '{"plan": "enterprise"}');

-- Create a sample production
INSERT INTO productions (id, organization_id, name, code, description, production_company, status) VALUES
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Pilot Episode', 'PILOT_S1', 'Season 1 Pilot Episode', 'Parrot Productions', 'active');

