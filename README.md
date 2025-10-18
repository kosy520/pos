# POS - Three-Way Invoice Authentication System

Offline-first POS system with three-way invoice authentication, QR code verification, and physical stock counting integration.

## Project Overview

This system implements a secure invoice verification workflow:

1. **Invoice Draft Creation** - Create provisional invoices offline or online
2. **QR Code Generation** - Generate device-signed (provisional) or server-signed (official) QR codes
3. **Three-Way Verification** - Compare supplier invoice, receiver invoice, and payment invoice
4. **Final Invoice Creation** - Create official server-signed invoice after verification
5. **Stock Counting** - Physical inventory counting with barcode scanning and reconciliation
6. **Offline-First Sync** - Queue operations locally and sync when online with idempotency

## Architecture

```
pos/
├── apps/
│   ├── backend/          # NestJS API server
│   │   ├── src/
│   │   │   ├── modules/  # Feature modules
│   │   │   ├── common/   # Shared utilities
│   │   │   └── config/   # Configuration
│   │   ├── prisma/       # Database schema and migrations
│   │   └── README.md
│   │
│   └── pwa/              # React Progressive Web App
│       ├── src/
│       │   ├── pages/    # Page components
│       │   ├── services/ # Business logic
│       │   └── db/       # IndexedDB schema
│       ├── public/       # Static assets
│       └── README.md
│
├── .github/
│   └── workflows/        # CI/CD workflows
│
└── README.md
```

## Technology Stack

### Backend
- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **QR Signing**: HMAC-SHA256 (server), RSA-PSS (device)

### Frontend (PWA)
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router
- **Local Storage**: Dexie.js (IndexedDB)
- **Offline**: Service Worker
- **QR Codes**: qrcode.react
- **Crypto**: Web Crypto API

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Backend Setup

```bash
cd apps/backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run prisma:generate
npm run prisma:migrate
npm run start:dev
```

Backend will run on `http://localhost:3000`

### Frontend Setup

```bash
cd apps/pwa
npm install
cp .env.example .env
# Edit .env to point to backend API
npm run dev
```

PWA will run on `http://localhost:5173`

## Features

### Backend API

- **Authentication** - JWT-based user authentication
- **Device Registration** - Register offline devices with public keys
- **Invoice Drafts** - CRUD operations for provisional invoices
- **QR Generation** - Server-signed QR codes for official invoices
- **Invoice Comparison** - Compare two invoice drafts or QR payloads
- **Final Invoices** - Create official invoices after verification
- **Stock Counting** - Physical inventory count sessions
- **Sync Endpoint** - Batch upload with idempotency for offline sync
- **Audit Logging** - Track all operations for compliance

See [Backend README](apps/backend/README.md) for detailed API documentation.

### PWA Application

- **Offline-First** - Works completely offline with IndexedDB
- **Invoice Scanner** - Create drafts by scanning products
- **QR Generation** - Device-signed provisional QR codes
- **Invoice Verifier** - Compare two QR payloads
- **Sync Queue** - Automatic batch sync when online
- **Background Sync** - Service worker for offline support

See [PWA README](apps/pwa/README.md) for detailed usage guide.

## Workflow

### 1. Device Registration

```bash
# Client generates RSA key pair
# Client calls: POST /api/v1/tenants/:tenantId/devices/register
{
  "deviceName": "Tablet-001",
  "publicKey": "-----BEGIN PUBLIC KEY-----..."
}

# Server stores device with public key
# Returns deviceId for future operations
```

### 2. Create Invoice Draft (Offline)

```javascript
// Client creates draft locally
const draft = {
  id: 'local-temp-id',
  draftNumber: 'D-001',
  lines: [
    { productId: 'p1', quantity: 2, unitPrice: 50.00 }
  ]
};

// Save to IndexedDB
await db.invoiceDraftsLocal.add(draft);

// Queue for sync
await SyncService.queueOperation('CREATE_DRAFT', draft, 'local-temp-id');
```

### 3. Generate Provisional QR (Offline)

```javascript
// Sign with device private key
const payload = {
  type: 'invoice_draft',
  draftId: draft.id,
  data: { ... },
  timestamp: Date.now()
};

const signed = await QRService.signWithDeviceKey(payload, deviceId);
// Display QR code
```

### 4. Sync to Server (When Online)

```bash
# Client: POST /api/v1/tenants/:tenantId/sync/upload
{
  "deviceId": "device-123",
  "operations": [
    {
      "opId": "uuid-1",
      "opType": "CREATE_DRAFT",
      "tempId": "local-temp-id",
      "payload": { ... }
    }
  ]
}

# Server response:
{
  "results": [
    {
      "opId": "uuid-1",
      "status": "success",
      "serverId": "draft-server-id",
      "tempId": "local-temp-id"
    }
  ]
}

# Client updates local records: tempId -> serverId
```

### 5. Compare Invoices

```bash
# POST /api/v1/tenants/:tenantId/invoice-comparisons
{
  "sourceQrPayload": "...",  # Supplier QR
  "targetQrPayload": "..."   # Receiver QR
}

# Returns comparison result with differences
```

### 6. Create Final Invoice (Server-Only)

```bash
# POST /api/v1/tenants/:tenantId/invoices/from-comparison
{
  "comparisonId": "comp-123",
  "invoiceNumber": "INV-001"
}

# Server creates official invoice with server-signed QR
# Returns final invoice and official QR code
```

## Security Features

### Multi-Layer Verification

1. **Device Signing** - RSA-PSS with device private key (offline)
2. **Server Signing** - HMAC-SHA256 with tenant secret (online)
3. **Three-Way Comparison** - Compare multiple parties' invoices
4. **Audit Logging** - Track all operations with timestamps

### Key Management

- **Device Private Keys** - Stored only in IndexedDB on device
- **Device Public Keys** - Stored in database for verification
- **Tenant Secrets** - Stored encrypted in database for server signing
- **JWT Tokens** - Short-lived tokens for API authentication

### Idempotency

- Each sync operation has unique `opId`
- Server tracks processed operations to prevent duplicates
- Safe to retry failed syncs without creating duplicates

## Database Schema

Key models:

- **Tenant** - Multi-tenant organization with signing secret
- **User** - User accounts with tenant scoping
- **Device** - Registered offline devices with public keys
- **InvoiceDraft** - Provisional invoices (offline/online)
- **InvoiceComparison** - Comparison results between invoices
- **InvoiceFinal** - Official server-signed invoices
- **StockCountSession** - Physical inventory count sessions
- **SyncOperation** - Sync operation tracking for idempotency
- **AuditLog** - Audit trail of all operations

See [Prisma Schema](apps/backend/prisma/schema.prisma) for full details.

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/register` - Register user

### Devices
- `POST /api/v1/tenants/:tenantId/devices/register`
- `GET /api/v1/tenants/:tenantId/devices`

### Invoice Drafts
- `POST /api/v1/tenants/:tenantId/invoice-drafts`
- `PATCH /api/v1/tenants/:tenantId/invoice-drafts/:id/lines`
- `POST /api/v1/tenants/:tenantId/invoice-drafts/:id/generate-qr`
- `GET /api/v1/tenants/:tenantId/invoice-drafts`

### Invoice Comparisons
- `POST /api/v1/tenants/:tenantId/invoice-comparisons`
- `GET /api/v1/tenants/:tenantId/invoice-comparisons/:id`

### Final Invoices
- `POST /api/v1/tenants/:tenantId/invoices/from-comparison`
- `GET /api/v1/tenants/:tenantId/invoices`

### Stock Counts
- `POST /api/v1/tenants/:tenantId/stock-counts`
- `POST /api/v1/tenants/:tenantId/stock-counts/:id/start`
- `POST /api/v1/tenants/:tenantId/stock-counts/:id/scan`
- `POST /api/v1/tenants/:tenantId/stock-counts/:id/reconcile/:productId`
- `POST /api/v1/tenants/:tenantId/stock-counts/:id/complete`

### Sync
- `POST /api/v1/tenants/:tenantId/sync/upload`

## Development

### Run Tests

Backend:
```bash
cd apps/backend
npm test
```

### Build for Production

Backend:
```bash
cd apps/backend
npm run build
npm run start:prod
```

Frontend:
```bash
cd apps/pwa
npm run build
npm run preview
```

### Database Migrations

```bash
cd apps/backend
npm run prisma:migrate
```

## Deployment

### Backend

1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Build and start server

### PWA

1. Build production bundle
2. Deploy to static hosting (Netlify, Vercel, etc.)
3. Configure service worker caching strategy
4. Update manifest.json with production URLs

## CI/CD

GitHub Actions workflow runs on every push:

- Backend: Runs tests and builds
- PWA: Builds production bundle

See [.github/workflows/ci.yml](.github/workflows/ci.yml)

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feat/my-feature`)
3. Commit changes (`git commit -m 'Add my feature'`)
4. Push to branch (`git push origin feat/my-feature`)
5. Open Pull Request

## License

MIT

## Support

For issues and questions:
- Open an issue on GitHub
- See individual README files in `/apps/backend` and `/apps/pwa`
