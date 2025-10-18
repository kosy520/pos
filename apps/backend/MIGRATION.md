# Database Migration Notes

## Initial Schema Setup

This migration creates the complete database schema for the three-way invoice authentication system.

### Tables Created

#### Core System Tables
- **tenants** - Multi-tenant organization data with QR signing secrets
- **users** - User accounts with tenant scoping
- **devices** - Registered offline devices with public keys
- **products** - Product catalog

#### Invoice Flow Tables
- **invoice_drafts** - Provisional invoices (offline/online created)
- **invoice_draft_lines** - Line items for drafts
- **invoice_comparisons** - Comparison results between invoices
- **invoice_finals** - Official server-signed invoices

#### Stock Management Tables
- **stock_count_sessions** - Physical inventory count sessions
- **stock_count_lines** - Individual product scans during counting
- **stock_adjustments** - Reconciliation adjustments

#### System Tables
- **audit_logs** - Complete audit trail
- **sync_operations** - Sync operation tracking for idempotency

### Key Features

#### Unique Constraints
- Email uniqueness for users
- SKU and barcode uniqueness for products
- Draft number uniqueness per tenant
- Invoice number uniqueness per tenant
- Session number uniqueness per tenant
- Operation ID uniqueness per tenant+device (idempotency)

#### Foreign Keys
- All tenant-scoped tables reference tenants
- Draft lines cascade delete with drafts
- Stock count lines cascade delete with sessions
- Soft deletes via SET NULL for optional references

#### Indexes
Automatic indexes on:
- Primary keys (all tables)
- Unique constraints
- Foreign keys

### Running the Migration

#### Method 1: Using Prisma (Recommended)

```bash
cd apps/backend

# Generate Prisma client
npm run prisma:generate

# Create and apply migration
npm run prisma:migrate

# Or for production
npm run prisma:deploy
```

#### Method 2: Manual SQL Execution

```bash
# Connect to your PostgreSQL database
psql -U username -d database_name

# Run the migration
\i apps/backend/prisma/migrations/00_init_schema.sql

# Optionally run seed data
\i apps/backend/prisma/seed.sql
```

### Post-Migration Steps

1. **Create Initial Tenant**
```sql
INSERT INTO tenants (id, name, signing_secret, created_at, updated_at)
VALUES (
  gen_random_uuid()::text,
  'Your Tenant Name',
  'your-secure-signing-secret-at-least-32-chars',
  NOW(),
  NOW()
);
```

2. **Create Admin User**
```bash
# Use bcrypt to hash password
node -e "console.log(require('bcrypt').hashSync('your-password', 10))"

# Then insert
INSERT INTO users (id, email, password, tenant_id, created_at, updated_at)
VALUES (
  gen_random_uuid()::text,
  'admin@example.com',
  '$2b$10$...',  -- bcrypt hash
  'your-tenant-id',
  NOW(),
  NOW()
);
```

3. **Seed Sample Products** (Optional for testing)
```bash
psql -U username -d database_name -f apps/backend/prisma/seed.sql
```

### Rollback

To rollback this migration:

```sql
-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS sync_operations CASCADE;
DROP TABLE IF EXISTS stock_adjustments CASCADE;
DROP TABLE IF EXISTS stock_count_lines CASCADE;
DROP TABLE IF EXISTS stock_count_sessions CASCADE;
DROP TABLE IF EXISTS invoice_finals CASCADE;
DROP TABLE IF EXISTS invoice_comparisons CASCADE;
DROP TABLE IF EXISTS invoice_draft_lines CASCADE;
DROP TABLE IF EXISTS invoice_drafts CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS devices CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
```

### Verification

After migration, verify tables exist:

```sql
-- List all tables
\dt

-- Check schema for a specific table
\d invoice_drafts

-- Verify foreign keys
SELECT
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

### Performance Considerations

For production deployments:

1. **Add Indexes** for frequently queried fields:
```sql
-- Example: Index on draft status for filtering
CREATE INDEX idx_invoice_drafts_status ON invoice_drafts(status);

-- Index on audit log action type
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Index on sync operation status
CREATE INDEX idx_sync_operations_status ON sync_operations(status);
```

2. **Partitioning** for large tables (optional):
```sql
-- Consider partitioning audit_logs by created_at for better performance
-- This is optional and only needed for high-volume systems
```

3. **Connection Pooling**: Configure Prisma connection pool in production:
```
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=10"
```

### Backup and Restore

Before running migrations in production:

```bash
# Backup
pg_dump -U username database_name > backup_before_migration.sql

# Restore if needed
psql -U username database_name < backup_before_migration.sql
```

### Troubleshooting

#### Migration Fails with "relation already exists"
- Tables already exist from a previous migration
- Drop existing tables or use `DROP TABLE IF EXISTS`

#### Foreign Key Constraint Violations
- Ensure parent tables (tenants, products, devices) are created first
- Check for orphaned records from previous data

#### Permission Denied
- Ensure database user has CREATE TABLE privileges
- Grant necessary permissions:
```sql
GRANT ALL PRIVILEGES ON DATABASE database_name TO username;
```

### Environment Variables

Required in `.env`:

```
DATABASE_URL="postgresql://user:password@localhost:5432/pos?schema=public"
JWT_SECRET="your-jwt-secret-here"
DEFAULT_TENANT_SECRET="your-tenant-qr-signing-secret"
```

### Next Steps

After successful migration:

1. Start backend server
2. Test device registration endpoint
3. Create sample invoice drafts
4. Test comparison workflow
5. Verify audit logging
6. Test sync operation flow

### Support

For issues:
- Check Prisma migration status: `npx prisma migrate status`
- View Prisma logs: `DEBUG="*" npm run prisma:migrate`
- Reset database (DEV ONLY): `npx prisma migrate reset`
