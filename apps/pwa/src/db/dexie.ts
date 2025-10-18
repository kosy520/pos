import Dexie, { Table } from 'dexie';

export interface Product {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  price: number;
  lastSyncedAt?: Date;
}

export interface InvoiceDraftLocal {
  id: string; // Local temp ID
  serverId?: string; // Server ID after sync
  draftNumber: string;
  deviceId?: string;
  totalAmount: number;
  status: 'draft' | 'provisional' | 'synced';
  qrPayload?: string;
  qrSignature?: string;
  lines: InvoiceDraftLine[];
  createdAt: Date;
  syncedAt?: Date;
}

export interface InvoiceDraftLine {
  productId: string;
  productSku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface StockCountSessionLocal {
  id: string; // Local temp ID
  serverId?: string; // Server ID after sync
  sessionNumber: string;
  deviceId?: string;
  status: 'draft' | 'in_progress' | 'completed' | 'synced';
  startedAt?: Date;
  completedAt?: Date;
  lines: StockCountLine[];
  createdAt: Date;
  syncedAt?: Date;
}

export interface StockCountLine {
  productId: string;
  productSku: string;
  productName: string;
  countedQuantity: number;
  scannedAt: Date;
}

export interface ChangeQueueItem {
  id?: number; // Auto-increment
  opId: string; // Unique operation ID (UUID)
  opType: string; // 'CREATE_DRAFT', 'UPDATE_DRAFT_LINES', 'CREATE_STOCK_COUNT', etc.
  tempId?: string; // Local temp ID
  payload: any; // Operation-specific data
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  serverId?: string; // Server ID after sync
  errorMessage?: string;
  createdAt: Date;
  syncedAt?: Date;
}

export interface DeviceInfo {
  id: string; // Device ID from server after registration
  deviceName: string;
  publicKey: string; // PEM format
  privateKey: string; // PEM format (stored securely)
  registeredAt: Date;
  lastSyncAt?: Date;
}

export class POSDatabase extends Dexie {
  products!: Table<Product, string>;
  invoiceDraftsLocal!: Table<InvoiceDraftLocal, string>;
  stockCountSessionsLocal!: Table<StockCountSessionLocal, string>;
  changeQueue!: Table<ChangeQueueItem, number>;
  devices!: Table<DeviceInfo, string>;

  constructor() {
    super('POSDatabase');
    
    this.version(1).stores({
      products: 'id, sku, barcode, name',
      invoiceDraftsLocal: 'id, serverId, draftNumber, status, createdAt',
      stockCountSessionsLocal: 'id, serverId, sessionNumber, status, createdAt',
      changeQueue: '++id, opId, opType, status, createdAt',
      devices: 'id, deviceName',
    });
  }
}

export const db = new POSDatabase();
