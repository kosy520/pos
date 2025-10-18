-- Seed data for testing

-- Insert demo tenant
INSERT INTO tenants (id, name, signing_secret, created_at, updated_at)
VALUES 
    ('tenant-123', 'Demo Tenant', 'demo-secret-change-in-production', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert demo user (password: 'password' hashed with bcrypt)
INSERT INTO users (id, email, password, tenant_id, created_at, updated_at)
VALUES 
    ('user-123', 'admin@example.com', '$2b$10$XqD3Z4YCM6Z8L0aP6F9O9.9K6Z8L0aP6F9O9.9K6Z8L0aP6F9O9.', 'tenant-123', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert sample products
INSERT INTO products (id, sku, barcode, name, description, price, created_at, updated_at)
VALUES 
    ('prod-1', 'SKU-001', '1234567890123', 'Product A', 'Sample product A', 10.99, NOW(), NOW()),
    ('prod-2', 'SKU-002', '1234567890124', 'Product B', 'Sample product B', 25.50, NOW(), NOW()),
    ('prod-3', 'SKU-003', '1234567890125', 'Product C', 'Sample product C', 5.75, NOW(), NOW()),
    ('prod-4', 'SKU-004', '1234567890126', 'Product D', 'Sample product D', 15.00, NOW(), NOW()),
    ('prod-5', 'SKU-005', '1234567890127', 'Product E', 'Sample product E', 99.99, NOW(), NOW())
ON CONFLICT (sku) DO NOTHING;

-- Note: Devices will be registered via API when PWA is used
-- Note: Invoice drafts, comparisons, and finals will be created during operation
-- Note: Stock count sessions will be created during operation
