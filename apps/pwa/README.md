# POS PWA - Offline-First Invoice Management

Progressive Web App for three-way invoice authentication with offline support.

## Features

- **Offline-First**: Works completely offline with local IndexedDB storage
- **Invoice Draft Creation**: Scan products and create invoice drafts
- **Device-Signed QR Codes**: Generate provisional QR codes signed with device keys
- **Invoice Verification**: Compare two QR payloads to detect differences
- **Sync Queue**: Automatic batch sync when connection is restored
- **Stock Counting**: Physical inventory count with barcode scanning (planned)

## Technology Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router
- **Local Database**: Dexie.js (IndexedDB wrapper)
- **QR Codes**: qrcode.react
- **Crypto**: Web Crypto API for device key generation and signing
- **PWA**: Service Worker for offline support

## Project Structure

```
src/
├── main.tsx            # Application entry point
├── App.tsx             # Root component with routing
├── index.css           # Global styles
├── db/
│   └── dexie.ts       # IndexedDB schema and setup
├── services/
│   ├── qr.ts          # QR code generation and signing
│   └── sync.ts        # Sync queue and upload logic
└── pages/
    ├── Scanner.tsx    # Invoice draft creation page
    ├── Verifier.tsx   # QR comparison page
    └── SyncStatus.tsx # Sync status and queue management
```

## Setup

### Prerequisites

- Node.js 18+
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

3. Configure `.env`:
```
VITE_API_URL=http://localhost:3000/api/v1
VITE_DEFAULT_TENANT_ID=your-tenant-id
```

## Running the Application

### Development
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Production Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Usage

### First Time Setup

1. **Register Device** (one-time):
   - The app will generate an RSA key pair on first use
   - Keys are stored securely in IndexedDB
   - Public key must be registered with the server via the backend API

2. **Login** (if auth is implemented):
   - Enter credentials to get JWT token
   - Token is stored in localStorage

### Creating Invoice Drafts

1. Navigate to **Scanner** page
2. Enter a draft number
3. Scan or manually enter products:
   - Enter product SKU or barcode
   - Enter quantity
   - Click "Add Item"
4. Review items in the list
5. Click **Create Draft** to save locally and queue for sync
6. Optionally click **Generate Provisional QR** to create a device-signed QR code

### Verifying Invoices

1. Navigate to **Verifier** page
2. Paste source QR payload JSON in first textarea
3. Paste target QR payload JSON in second textarea
4. Click **Compare**
5. View comparison results:
   - Green = Match
   - Red = Differences found
   - See detailed list of differences
6. If matched, optionally queue for final invoice creation

### Syncing Data

1. Navigate to **Sync Status** page
2. View pending, failed, and synced operations
3. Click **Sync Now** to upload pending operations
4. Server will return mapping of temp IDs to server IDs
5. Local records are updated with server IDs

## Offline Behavior

### What Works Offline

- Creating invoice drafts
- Generating device-signed QR codes
- Viewing local drafts and history
- Queuing operations for sync
- Basic stock counting (scan and record)

### What Requires Online Connection

- Comparing QR payloads (calls backend API)
- Creating final invoices (server-only operation)
- Uploading sync queue
- Device registration
- User authentication

## Data Storage

All data is stored locally in IndexedDB via Dexie.js:

- **products**: Product catalog (synced from server)
- **invoiceDraftsLocal**: Invoice drafts created locally
- **stockCountSessionsLocal**: Stock count sessions
- **changeQueue**: Operations queued for sync
- **devices**: Device registration info and keys

## Security

- Device private keys stored only in IndexedDB (never sent to server)
- Public keys registered with server for verification
- All API calls require JWT authentication
- Device-signed QRs use RSA-PSS with SHA-256
- Server-signed QRs use HMAC-SHA256 with tenant secret

## PWA Features

### Service Worker

- Caches app shell for offline access
- Automatically updates when new version deployed
- Network-first strategy for API calls

### Install Prompt

- Users can install as standalone app on mobile/desktop
- Works like a native app

### Manifest

- Custom app name and icons
- Theme color matching brand
- Display mode: standalone

## Troubleshooting

### App Won't Load Offline

1. Check service worker is registered (DevTools > Application > Service Workers)
2. Check cache storage (DevTools > Application > Cache Storage)
3. Reload page and check console for errors

### Sync Fails

1. Check you're online
2. Verify API_URL in .env is correct
3. Check you have valid JWT token
4. Check device is registered

### QR Generation Fails

1. Ensure device keys are generated
2. Check device ID is set
3. Verify crypto API is available (HTTPS required in production)

### Products Not Found

1. Need to sync product catalog first
2. Add products to IndexedDB manually for testing:

```javascript
import { db } from './src/db/dexie';

await db.products.add({
  id: 'prod-1',
  sku: 'SKU-001',
  barcode: '1234567890',
  name: 'Test Product',
  price: 10.99,
});
```

## Development Notes

### Adding New Sync Operations

1. Add operation type to `SyncService.queueOperation`
2. Add case in backend `SyncService.processOperation`
3. Add local record update in `SyncService.updateLocalRecordWithServerId`

### Adding New Pages

1. Create page component in `src/pages/`
2. Add route in `App.tsx`
3. Add navigation link in navbar

## Future Enhancements

- [ ] Camera-based barcode scanning
- [ ] Stock count sessions UI
- [ ] Offline QR scanning and parsing
- [ ] Background sync API integration
- [ ] Push notifications for sync results
- [ ] Conflict resolution UI
- [ ] Export/import data

## License

MIT
