# POS Backend - Three-Way Invoice Authentication MVP

Backend API for three-way invoice authentication with offline-first PWA support and physical stock-taking integration.

## Features

- **Device Registration**: Register offline devices with public keys
- **Invoice Drafts**: Create and manage provisional invoice drafts (offline/online)
- **QR Code Generation**: Generate device-signed and server-signed QR codes
- **Invoice Comparison**: Compare two invoice drafts or QR payloads
- **Final Invoices**: Create official invoices after comparison approval
- **Stock Counting**: Physical inventory count sessions with scanning
- **Sync Endpoint**: Batch upload with idempotency for offline-to-online sync
- **Audit Logging**: Track all operations for compliance

## Technology Stack

- **Framework**: NestJS
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT
- **QR Signing**: HMAC-SHA256 (tenant secret) and RSA (device keys)

## Project Structure

```
src/
├── main.ts                 # Application entry point
├── app.module.ts           # Root module
├── modules/
│   ├── auth/              # JWT authentication
│   ├── devices/           # Device registration
│   ├── invoice-drafts/    # Draft invoice management
│   ├── invoice-comparisons/ # Comparison logic
│   ├── invoices/          # Final invoices
│   ├── stock-counts/      # Stock count sessions
│   ├── sync/              # Batch sync endpoint
│   └── prisma/            # Prisma service
├── common/
│   ├── guards/            # JWT auth guard
│   ├── decorators/        # Custom decorators
│   └── utils/             # QR utilities
└── config/                # Configuration
```

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Configure `.env` with your database credentials and secrets:
```
DATABASE_URL="postgresql://user:password@localhost:5432/pos?schema=public"
JWT_SECRET="your-secure-jwt-secret"
DEFAULT_TENANT_SECRET="your-tenant-qr-signing-secret"
```

### Database Migration

1. Generate Prisma client:
```bash
npm run prisma:generate
```

2. Run migrations:
```bash
npm run prisma:migrate
```

Or for production:
```bash
npm run prisma:deploy
```

### Seed Data (Optional)

Create a tenant with signing secret:

```sql
INSERT INTO tenants (id, name, signing_secret, created_at, updated_at)
VALUES (
  'tenant-123',
  'Demo Tenant',
  'demo-signing-secret-change-in-production',
  NOW(),
  NOW()
);
```

Create a test user:

```sql
INSERT INTO users (id, email, password, tenant_id, created_at, updated_at)
VALUES (
  'user-123',
  'admin@example.com',
  '$2b$10$XYZ...', -- bcrypt hash of 'password'
  'tenant-123',
  NOW(),
  NOW()
);
```

## Running the Application

### Development
```bash
npm run start:dev
```

### Production
```bash
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000/api/v1`

## Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:cov
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login and get JWT token
- `POST /api/v1/auth/register` - Register new user

### Devices
- `POST /api/v1/tenants/:tenantId/devices/register` - Register device
- `GET /api/v1/tenants/:tenantId/devices` - List devices

### Invoice Drafts
- `POST /api/v1/tenants/:tenantId/invoice-drafts` - Create draft
- `PATCH /api/v1/tenants/:tenantId/invoice-drafts/:id/lines` - Update lines
- `POST /api/v1/tenants/:tenantId/invoice-drafts/:id/generate-qr` - Generate QR
- `GET /api/v1/tenants/:tenantId/invoice-drafts` - List drafts
- `GET /api/v1/tenants/:tenantId/invoice-drafts/:id` - Get draft

### Invoice Comparisons
- `POST /api/v1/tenants/:tenantId/invoice-comparisons` - Compare invoices
- `GET /api/v1/tenants/:tenantId/invoice-comparisons/:id` - Get comparison

### Final Invoices
- `POST /api/v1/tenants/:tenantId/invoices/from-comparison` - Create final invoice
- `GET /api/v1/tenants/:tenantId/invoices` - List invoices
- `GET /api/v1/tenants/:tenantId/invoices/:id` - Get invoice

### Stock Counts
- `POST /api/v1/tenants/:tenantId/stock-counts` - Create session
- `POST /api/v1/tenants/:tenantId/stock-counts/:id/start` - Start session
- `POST /api/v1/tenants/:tenantId/stock-counts/:id/scan` - Scan product
- `POST /api/v1/tenants/:tenantId/stock-counts/:id/reconcile/:productId` - Reconcile
- `POST /api/v1/tenants/:tenantId/stock-counts/:id/complete` - Complete session
- `GET /api/v1/tenants/:tenantId/stock-counts` - List sessions
- `GET /api/v1/tenants/:tenantId/stock-counts/:id` - Get session

### Sync
- `POST /api/v1/tenants/:tenantId/sync/upload` - Batch upload operations

## Device Onboarding Runbook

### 1. Generate Device Keys (Client-Side)

On the device (PWA):
```javascript
// Generate RSA key pair
const keyPair = await crypto.subtle.generateKey(
  {
    name: "RSA-PSS",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256",
  },
  true,
  ["sign", "verify"]
);

// Export public key
const publicKey = await crypto.subtle.exportKey("spki", keyPair.publicKey);
const publicKeyPem = convertToPem(publicKey);

// Store private key securely in IndexedDB
```

### 2. Register Device

Call the registration endpoint:
```bash
curl -X POST http://localhost:3000/api/v1/tenants/tenant-123/devices/register \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceName": "Tablet-001",
    "publicKey": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBg..."
  }'
```

Response:
```json
{
  "id": "device-456",
  "deviceName": "Tablet-001",
  "registeredAt": "2025-10-18T07:00:00Z",
  "isActive": true
}
```

### 3. Store Device ID

Save the `deviceId` on the device for future sync operations.

## Sync Operation Flow

### Client Side (PWA)

1. Queue operations locally with unique `opId`
2. When online, upload batch:

```javascript
const syncPayload = {
  deviceId: "device-456",
  operations: [
    {
      opId: "uuid-1",
      opType: "CREATE_DRAFT",
      tempId: "local-draft-1",
      payload: {
        draftNumber: "D-001",
        lines: [...]
      }
    },
    {
      opId: "uuid-2",
      opType: "SCAN_PRODUCT",
      tempId: "local-scan-1",
      payload: {
        sessionId: "session-123",
        productId: "product-456",
        quantity: 5
      }
    }
  ]
};
```

### Server Response

```json
{
  "results": [
    {
      "opId": "uuid-1",
      "status": "success",
      "serverId": "draft-server-789",
      "tempId": "local-draft-1"
    },
    {
      "opId": "uuid-2",
      "status": "success",
      "serverId": "scan-server-012",
      "tempId": "local-scan-1"
    }
  ],
  "summary": {
    "total": 2,
    "success": 2,
    "failed": 0,
    "duplicates": 0
  }
}
```

### Client Reconciliation

Map `tempId` → `serverId` in local database and mark operations as synced.

## QR Code Signing

### Server-Signed QR (Official)

Used for final invoices:
- Signed with tenant's `signingSecret` using HMAC-SHA256
- Can be verified by any party with the secret

### Device-Signed QR (Provisional)

Used for draft invoices:
- Signed with device's private key (RSA-PSS)
- Can be verified using device's public key from database

## Security Considerations

- All endpoints require JWT authentication
- Tenant scoping enforced on all operations
- Device public keys stored server-side
- Tenant signing secrets stored encrypted
- Audit logs for all operations
- Idempotent sync operations prevent duplicate processing

## Migration Notes

When deploying to a new environment:

1. Run database migrations
2. Seed tenant records with signing secrets
3. Create initial user accounts
4. Seed product catalog (if applicable)
5. Configure environment variables
6. Test device registration flow
7. Test sync operation end-to-end

## Troubleshooting

### Prisma Client Not Generated
```bash
npm run prisma:generate
```

### Migration Failed
```bash
# Reset database (DEV ONLY)
npx prisma migrate reset

# Or manually fix and rerun
npm run prisma:migrate
```

### JWT Token Invalid
Check JWT_SECRET in `.env` matches the token issuer.

### Sync Operations Failing
Check device is registered and `deviceId` is correct.

## License

MIT
