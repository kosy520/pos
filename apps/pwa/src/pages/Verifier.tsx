import React, { useState } from 'react';

interface ComparisonResult {
  matched: boolean;
  differences: Array<{
    field: string;
    source: any;
    target: any;
  }>;
  summary: {
    totalDifferences: number;
    criticalDifferences: number;
  };
}

export const Verifier: React.FC = () => {
  const [sourceQr, setSourceQr] = useState('');
  const [targetQr, setTargetQr] = useState('');
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCompare = async () => {
    if (!sourceQr || !targetQr) {
      alert('Please enter both QR payloads');
      return;
    }

    setLoading(true);
    try {
      // Call comparison endpoint
      const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api/v1';
      const tenantId = 'tenant-123'; // TODO: Get from auth
      const token = localStorage.getItem('access_token'); // TODO: Better auth management

      const response = await fetch(
        `${API_BASE_URL}/tenants/${tenantId}/invoice-comparisons`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            sourceQrPayload: sourceQr,
            targetQrPayload: targetQr,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Comparison failed: ${response.statusText}`);
      }

      const result = await response.json();
      setComparisonResult(result.result);
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleQueueFinalization = async () => {
    if (!comparisonResult || !comparisonResult.matched) {
      alert('Can only finalize matched invoices');
      return;
    }

    // Queue operation to create final invoice (will be done online)
    alert('Finalization queued. This will be processed when online.');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Invoice Verifier</h1>
      <p>Compare two QR code payloads to verify invoice authenticity</p>

      <div style={{ marginBottom: '20px' }}>
        <h3>Source QR Payload</h3>
        <textarea
          value={sourceQr}
          onChange={(e) => setSourceQr(e.target.value)}
          placeholder='Paste QR payload JSON here (e.g., {"type":"invoice_draft",...})'
          style={{
            width: '100%',
            height: '150px',
            padding: '10px',
            fontFamily: 'monospace',
            fontSize: '12px',
          }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Target QR Payload</h3>
        <textarea
          value={targetQr}
          onChange={(e) => setTargetQr(e.target.value)}
          placeholder='Paste QR payload JSON here (e.g., {"type":"invoice_draft",...})'
          style={{
            width: '100%',
            height: '150px',
            padding: '10px',
            fontFamily: 'monospace',
            fontSize: '12px',
          }}
        />
      </div>

      <button
        onClick={handleCompare}
        disabled={loading || !sourceQr || !targetQr}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading || !sourceQr || !targetQr ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Comparing...' : 'Compare'}
      </button>

      {comparisonResult && (
        <div
          style={{
            marginTop: '30px',
            border: `2px solid ${comparisonResult.matched ? '#28a745' : '#dc3545'}`,
            padding: '20px',
            borderRadius: '8px',
            backgroundColor: comparisonResult.matched ? '#d4edda' : '#f8d7da',
          }}
        >
          <h2 style={{ marginTop: 0, color: comparisonResult.matched ? '#155724' : '#721c24' }}>
            {comparisonResult.matched ? '✓ Invoices Match' : '✗ Invoices Do Not Match'}
          </h2>

          <div style={{ marginBottom: '15px' }}>
            <strong>Summary:</strong>
            <ul>
              <li>Total Differences: {comparisonResult.summary.totalDifferences}</li>
              <li>Critical Differences: {comparisonResult.summary.criticalDifferences}</li>
            </ul>
          </div>

          {comparisonResult.differences.length > 0 && (
            <div>
              <h3>Differences Found:</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ccc' }}>
                    <th style={{ textAlign: 'left', padding: '8px' }}>Field</th>
                    <th style={{ textAlign: 'left', padding: '8px' }}>Source Value</th>
                    <th style={{ textAlign: 'left', padding: '8px' }}>Target Value</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonResult.differences.map((diff, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px', fontWeight: 'bold' }}>{diff.field}</td>
                      <td style={{ padding: '8px' }}>
                        {diff.source === null ? '(missing)' : JSON.stringify(diff.source)}
                      </td>
                      <td style={{ padding: '8px' }}>
                        {diff.target === null ? '(missing)' : JSON.stringify(diff.target)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {comparisonResult.matched && (
            <div style={{ marginTop: '20px' }}>
              <button
                onClick={handleQueueFinalization}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Queue for Final Invoice Creation
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
