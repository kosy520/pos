import React, { useState, useEffect } from 'react';
import { db } from '../db/dexie';
import { SyncService } from '../services/sync';
import { QRService, SignedQRPayload } from '../services/qr';
import { QRCodeSVG } from 'qrcode.react';

interface ScannedItem {
  productId: string;
  productSku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export const Scanner: React.FC = () => {
  const [draftNumber, setDraftNumber] = useState('');
  const [items, setItems] = useState<ScannedItem[]>([]);
  const [productInput, setProductInput] = useState('');
  const [quantityInput, setQuantityInput] = useState('1');
  const [qrPayload, setQrPayload] = useState<SignedQRPayload | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [tenantId] = useState('tenant-123'); // TODO: Get from auth

  useEffect(() => {
    loadDeviceId();
  }, []);

  const loadDeviceId = async () => {
    const devices = await db.devices.toArray();
    if (devices.length > 0) {
      setDeviceId(devices[0].id);
    }
  };

  const handleScanProduct = async () => {
    if (!productInput) {
      alert('Please enter product SKU or barcode');
      return;
    }

    // Find product
    const product = await db.products
      .where('sku')
      .equals(productInput)
      .or('barcode')
      .equals(productInput)
      .first();

    if (!product) {
      alert('Product not found. Please sync product catalog.');
      return;
    }

    const quantity = parseFloat(quantityInput);
    const lineTotal = quantity * product.price;

    setItems([
      ...items,
      {
        productId: product.id,
        productSku: product.sku,
        productName: product.name,
        quantity,
        unitPrice: product.price,
        lineTotal,
      },
    ]);

    setProductInput('');
    setQuantityInput('1');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const getTotalAmount = () => {
    return items.reduce((sum, item) => sum + item.lineTotal, 0);
  };

  const handleCreateDraft = async () => {
    if (!draftNumber) {
      alert('Please enter draft number');
      return;
    }

    if (items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    const draftId = `draft-${Date.now()}`;
    const totalAmount = getTotalAmount();

    // Save draft locally
    await db.invoiceDraftsLocal.add({
      id: draftId,
      draftNumber,
      deviceId: deviceId || undefined,
      totalAmount,
      status: 'draft',
      lines: items,
      createdAt: new Date(),
    });

    // Queue sync operation
    await SyncService.queueOperation('CREATE_DRAFT', {
      draftNumber,
      deviceId,
      lines: items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    }, draftId);

    alert('Draft created and queued for sync!');
    
    // Reset form
    setDraftNumber('');
    setItems([]);
    setQrPayload(null);
  };

  const handleGenerateProvisionalQR = async () => {
    if (!deviceId) {
      alert('No device registered');
      return;
    }

    if (items.length === 0) {
      alert('Please add items first');
      return;
    }

    const payload = {
      type: 'invoice_draft' as const,
      draftId: `provisional-${Date.now()}`,
      tenantId,
      data: {
        draftNumber: draftNumber || 'PROVISIONAL',
        totalAmount: getTotalAmount(),
        lines: items,
      },
      timestamp: Date.now(),
    };

    const signed = await QRService.signWithDeviceKey(payload, deviceId);
    setQrPayload(signed);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Create Invoice Draft</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <label>
          Draft Number:
          <input
            type="text"
            value={draftNumber}
            onChange={(e) => setDraftNumber(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '15px' }}>
        <h3>Scan Product</h3>
        <div>
          <input
            type="text"
            placeholder="SKU or Barcode"
            value={productInput}
            onChange={(e) => setProductInput(e.target.value)}
            style={{ marginRight: '10px', padding: '5px' }}
          />
          <input
            type="number"
            placeholder="Quantity"
            value={quantityInput}
            onChange={(e) => setQuantityInput(e.target.value)}
            style={{ marginRight: '10px', padding: '5px', width: '80px' }}
            min="0.01"
            step="0.01"
          />
          <button onClick={handleScanProduct} style={{ padding: '5px 15px' }}>
            Add Item
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Items ({items.length})</h3>
        {items.length === 0 ? (
          <p style={{ color: '#666' }}>No items added yet</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ccc' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>SKU</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Product</th>
                <th style={{ textAlign: 'right', padding: '8px' }}>Qty</th>
                <th style={{ textAlign: 'right', padding: '8px' }}>Price</th>
                <th style={{ textAlign: 'right', padding: '8px' }}>Total</th>
                <th style={{ padding: '8px' }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px' }}>{item.productSku}</td>
                  <td style={{ padding: '8px' }}>{item.productName}</td>
                  <td style={{ textAlign: 'right', padding: '8px' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right', padding: '8px' }}>${item.unitPrice.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '8px' }}>${item.lineTotal.toFixed(2)}</td>
                  <td style={{ padding: '8px' }}>
                    <button onClick={() => handleRemoveItem(index)} style={{ padding: '2px 8px' }}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #ccc', fontWeight: 'bold' }}>
                <td colSpan={4} style={{ textAlign: 'right', padding: '8px' }}>Total:</td>
                <td style={{ textAlign: 'right', padding: '8px' }}>${getTotalAmount().toFixed(2)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={handleCreateDraft}
          disabled={items.length === 0}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: items.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          Create Draft
        </button>
        <button
          onClick={handleGenerateProvisionalQR}
          disabled={items.length === 0}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: items.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          Generate Provisional QR
        </button>
      </div>

      {qrPayload && (
        <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '15px' }}>
          <h3>Provisional QR Code (Device-Signed)</h3>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
            <QRCodeSVG value={JSON.stringify(qrPayload)} size={256} />
          </div>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
            Signed by device: {qrPayload.signedBy}
          </p>
        </div>
      )}
    </div>
  );
};
