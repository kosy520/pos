import { db } from '../db/dexie';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api/v1';

export interface SyncResult {
  opId: string;
  status: 'success' | 'failed' | 'duplicate';
  serverId?: string;
  tempId?: string;
  errorMessage?: string;
}

export class SyncService {
  private static accessToken: string | null = null;
  private static tenantId: string | null = null;

  static setAuth(token: string, tenantId: string) {
    this.accessToken = token;
    this.tenantId = tenantId;
  }

  /**
   * Queue an operation for sync
   */
  static async queueOperation(
    opType: string,
    payload: any,
    tempId?: string
  ): Promise<void> {
    const opId = uuidv4();
    
    await db.changeQueue.add({
      opId,
      opType,
      tempId,
      payload,
      status: 'pending',
      createdAt: new Date(),
    });
  }

  /**
   * Upload pending operations to server
   */
  static async uploadPendingOperations(deviceId: string): Promise<{
    total: number;
    success: number;
    failed: number;
  }> {
    if (!this.accessToken || !this.tenantId) {
      throw new Error('Not authenticated');
    }

    // Get pending operations
    const pendingOps = await db.changeQueue
      .where('status')
      .equals('pending')
      .toArray();

    if (pendingOps.length === 0) {
      return { total: 0, success: 0, failed: 0 };
    }

    // Mark as syncing
    await Promise.all(
      pendingOps.map(op =>
        db.changeQueue.update(op.id!, { status: 'syncing' })
      )
    );

    try {
      // Upload batch
      const response = await fetch(
        `${API_BASE_URL}/tenants/${this.tenantId}/sync/upload`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`,
          },
          body: JSON.stringify({
            deviceId,
            operations: pendingOps.map(op => ({
              opId: op.opId,
              opType: op.opType,
              tempId: op.tempId,
              payload: op.payload,
            })),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      const results: SyncResult[] = result.results;

      // Process results
      let successCount = 0;
      let failedCount = 0;

      for (const syncResult of results) {
        const queueItem = pendingOps.find(op => op.opId === syncResult.opId);
        if (!queueItem) continue;

        if (syncResult.status === 'success' || syncResult.status === 'duplicate') {
          // Update local record with server ID
          await this.updateLocalRecordWithServerId(
            queueItem.opType,
            queueItem.tempId,
            syncResult.serverId
          );

          // Mark as synced
          await db.changeQueue.update(queueItem.id!, {
            status: 'synced',
            serverId: syncResult.serverId,
            syncedAt: new Date(),
          });

          successCount++;
        } else {
          // Mark as failed
          await db.changeQueue.update(queueItem.id!, {
            status: 'failed',
            errorMessage: syncResult.errorMessage,
          });

          failedCount++;
        }
      }

      // Update device last sync
      const device = await db.devices.get(deviceId);
      if (device) {
        await db.devices.update(deviceId, { lastSyncAt: new Date() });
      }

      return {
        total: pendingOps.length,
        success: successCount,
        failed: failedCount,
      };
    } catch (error) {
      // Revert to pending
      await Promise.all(
        pendingOps.map(op =>
          db.changeQueue.update(op.id!, { status: 'pending' })
        )
      );

      throw error;
    }
  }

  /**
   * Update local records with server IDs
   */
  private static async updateLocalRecordWithServerId(
    opType: string,
    tempId: string | undefined,
    serverId: string | undefined
  ): Promise<void> {
    if (!tempId || !serverId) return;

    switch (opType) {
      case 'CREATE_DRAFT':
      case 'UPDATE_DRAFT_LINES':
        const draft = await db.invoiceDraftsLocal.get(tempId);
        if (draft) {
          await db.invoiceDraftsLocal.update(tempId, {
            serverId,
            status: 'synced',
            syncedAt: new Date(),
          });
        }
        break;

      case 'CREATE_STOCK_COUNT':
      case 'START_STOCK_COUNT':
      case 'SCAN_PRODUCT':
      case 'COMPLETE_STOCK_COUNT':
        const session = await db.stockCountSessionsLocal.get(tempId);
        if (session) {
          await db.stockCountSessionsLocal.update(tempId, {
            serverId,
            status: 'synced',
            syncedAt: new Date(),
          });
        }
        break;
    }
  }

  /**
   * Get pending operations count
   */
  static async getPendingCount(): Promise<number> {
    return await db.changeQueue.where('status').equals('pending').count();
  }

  /**
   * Get last sync time for device
   */
  static async getLastSyncTime(deviceId: string): Promise<Date | null> {
    const device = await db.devices.get(deviceId);
    return device?.lastSyncAt || null;
  }

  /**
   * Clear synced operations (older than 7 days)
   */
  static async clearOldSyncedOperations(): Promise<void> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    await db.changeQueue
      .where('status')
      .equals('synced')
      .and(item => item.syncedAt! < sevenDaysAgo)
      .delete();
  }
}

// Note: uuid package needs to be installed
// For now, using a simple UUID generator
function uuidv4Fallback() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const uuidv4 = typeof crypto !== 'undefined' && crypto.randomUUID 
  ? () => crypto.randomUUID() 
  : uuidv4Fallback;
