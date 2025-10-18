import React, { useState, useEffect } from 'react';
import { db, ChangeQueueItem } from '../db/dexie';
import { SyncService } from '../services/sync';

export const SyncStatus: React.FC = () => {
  const [pendingOps, setPendingOps] = useState<ChangeQueueItem[]>([]);
  const [syncedOps, setSyncedOps] = useState<ChangeQueueItem[]>([]);
  const [failedOps, setFailedOps] = useState<ChangeQueueItem[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    // Load operations
    const pending = await db.changeQueue.where('status').equals('pending').toArray();
    const synced = await db.changeQueue.where('status').equals('synced').limit(20).reverse().toArray();
    const failed = await db.changeQueue.where('status').equals('failed').toArray();

    setPendingOps(pending);
    setSyncedOps(synced);
    setFailedOps(failed);

    // Load device info
    const devices = await db.devices.toArray();
    if (devices.length > 0) {
      setDeviceId(devices[0].id);
      const lastSync = await SyncService.getLastSyncTime(devices[0].id);
      setLastSyncTime(lastSync);
    }
  };

  const handleSync = async () => {
    if (!deviceId) {
      alert('No device registered');
      return;
    }

    setSyncing(true);
    try {
      const result = await SyncService.uploadPendingOperations(deviceId);
      alert(`Sync complete! ${result.success} succeeded, ${result.failed} failed`);
      await loadData();
    } catch (error) {
      alert(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  const formatOpType = (opType: string) => {
    return opType.replace(/_/g, ' ');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>Sync Status</h1>

      <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3>Device Information</h3>
        <p><strong>Device ID:</strong> {deviceId || 'Not registered'}</p>
        <p><strong>Last Sync:</strong> {lastSyncTime ? formatDate(lastSyncTime) : 'Never'}</p>
        <p><strong>Pending Operations:</strong> {pendingOps.length}</p>
        <p><strong>Failed Operations:</strong> {failedOps.length}</p>
        
        <button
          onClick={handleSync}
          disabled={syncing || pendingOps.length === 0}
          style={{
            marginTop: '10px',
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: syncing || pendingOps.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          {syncing ? 'Syncing...' : `Sync Now (${pendingOps.length} pending)`}
        </button>
      </div>

      {pendingOps.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h3>Pending Operations ({pendingOps.length})</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ccc' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Type</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Created</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {pendingOps.map((op) => (
                <tr key={op.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px' }}>{formatOpType(op.opType)}</td>
                  <td style={{ padding: '8px' }}>{formatDate(op.createdAt)}</td>
                  <td style={{ padding: '8px' }}>
                    <span style={{ padding: '4px 8px', backgroundColor: '#ffc107', borderRadius: '4px' }}>
                      {op.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {failedOps.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h3>Failed Operations ({failedOps.length})</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ccc' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Type</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Created</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Error</th>
              </tr>
            </thead>
            <tbody>
              {failedOps.map((op) => (
                <tr key={op.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px' }}>{formatOpType(op.opType)}</td>
                  <td style={{ padding: '8px' }}>{formatDate(op.createdAt)}</td>
                  <td style={{ padding: '8px', color: '#dc3545', fontSize: '12px' }}>
                    {op.errorMessage || 'Unknown error'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {syncedOps.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h3>Recently Synced Operations (Last 20)</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ccc' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Type</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Synced</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Server ID</th>
              </tr>
            </thead>
            <tbody>
              {syncedOps.map((op) => (
                <tr key={op.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px' }}>{formatOpType(op.opType)}</td>
                  <td style={{ padding: '8px' }}>{formatDate(op.syncedAt)}</td>
                  <td style={{ padding: '8px', fontSize: '12px', fontFamily: 'monospace' }}>
                    {op.serverId ? op.serverId.substring(0, 8) + '...' : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
