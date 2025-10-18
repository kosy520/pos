import { QRService, QRPayload } from '../qr.service';

describe('QRService', () => {
  const tenantSecret = 'test-secret-key';
  const mockPayload: QRPayload = {
    type: 'invoice_draft',
    draftId: 'draft-123',
    tenantId: 'tenant-456',
    data: {
      draftNumber: 'D-001',
      totalAmount: 100.50,
      lines: [
        { productSku: 'SKU-1', quantity: 2, unitPrice: 50.25 },
      ],
    },
    timestamp: Date.now(),
  };

  describe('signWithTenantSecret', () => {
    it('should sign payload with HMAC-SHA256', () => {
      const signed = QRService.signWithTenantSecret(mockPayload, tenantSecret);
      
      expect(signed).toHaveProperty('signature');
      expect(signed.signedBy).toBe('server');
      expect(signed.type).toBe('invoice_draft');
    });

    it('should produce consistent signatures for same payload', () => {
      const signed1 = QRService.signWithTenantSecret(mockPayload, tenantSecret);
      const signed2 = QRService.signWithTenantSecret(mockPayload, tenantSecret);
      
      expect(signed1.signature).toBe(signed2.signature);
    });
  });

  describe('verifyTenantSignature', () => {
    it('should verify valid signature', () => {
      const signed = QRService.signWithTenantSecret(mockPayload, tenantSecret);
      const isValid = QRService.verifyTenantSignature(signed, tenantSecret);
      
      expect(isValid).toBe(true);
    });

    it('should reject invalid signature', () => {
      const signed = QRService.signWithTenantSecret(mockPayload, tenantSecret);
      signed.signature = 'invalid-signature';
      const isValid = QRService.verifyTenantSignature(signed, tenantSecret);
      
      expect(isValid).toBe(false);
    });

    it('should reject signature with wrong secret', () => {
      const signed = QRService.signWithTenantSecret(mockPayload, tenantSecret);
      const isValid = QRService.verifyTenantSignature(signed, 'wrong-secret');
      
      expect(isValid).toBe(false);
    });

    it('should reject tampered payload', () => {
      const signed = QRService.signWithTenantSecret(mockPayload, tenantSecret);
      (signed as any).data.totalAmount = 999.99;
      const isValid = QRService.verifyTenantSignature(signed, tenantSecret);
      
      expect(isValid).toBe(false);
    });
  });

  describe('parseQRData', () => {
    it('should parse QR data string', () => {
      const signed = QRService.signWithTenantSecret(mockPayload, tenantSecret);
      const qrString = JSON.stringify(signed);
      const parsed = QRService.parseQRData(qrString);
      
      expect(parsed.type).toBe('invoice_draft');
      expect(parsed.draftId).toBe('draft-123');
      expect(parsed.signature).toBe(signed.signature);
    });
  });
});
