import * as crypto from 'crypto';
import * as QRCode from 'qrcode';

export interface QRPayload {
  type: 'invoice_draft' | 'invoice_final';
  draftId?: string;
  invoiceId?: string;
  tenantId: string;
  data: any;
  timestamp: number;
}

export interface SignedQRPayload extends QRPayload {
  signature: string;
  signedBy: string; // 'device_id' or 'server'
}

export class QRService {
  /**
   * Sign QR payload with tenant secret (HMAC-SHA256)
   * Used for server-side signing
   */
  static signWithTenantSecret(payload: QRPayload, tenantSecret: string): SignedQRPayload {
    const payloadString = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', tenantSecret)
      .update(payloadString)
      .digest('hex');

    return {
      ...payload,
      signature,
      signedBy: 'server',
    };
  }

  /**
   * Verify QR payload signed with tenant secret
   */
  static verifyTenantSignature(
    signedPayload: SignedQRPayload,
    tenantSecret: string,
  ): boolean {
    const { signature, signedBy, ...payload } = signedPayload;
    const payloadString = JSON.stringify(payload);
    const expectedSignature = crypto
      .createHmac('sha256', tenantSecret)
      .update(payloadString)
      .digest('hex');

    return signature === expectedSignature;
  }

  /**
   * Verify device-signed QR payload
   * Device signs with private key (stored on device)
   * Server verifies with public key (stored in DB)
   */
  static verifyDeviceSignature(
    signedPayload: SignedQRPayload,
    devicePublicKey: string,
  ): boolean {
    try {
      const { signature, signedBy, ...payload } = signedPayload;
      const payloadString = JSON.stringify(payload);
      
      const verify = crypto.createVerify('RSA-SHA256');
      verify.update(payloadString);
      verify.end();
      
      return verify.verify(devicePublicKey, signature, 'hex');
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate QR code image data URL
   */
  static async generateQRCode(signedPayload: SignedQRPayload): Promise<string> {
    const data = JSON.stringify(signedPayload);
    return await QRCode.toDataURL(data);
  }

  /**
   * Parse QR code data
   */
  static parseQRData(qrData: string): SignedQRPayload {
    return JSON.parse(qrData);
  }
}
