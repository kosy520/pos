import { db } from '../db/dexie';

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
  signedBy: string;
}

export class QRService {
  /**
   * Generate RSA key pair for device
   */
  static async generateDeviceKeyPair(): Promise<{
    publicKey: string;
    privateKey: string;
  }> {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-PSS',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['sign', 'verify']
    );

    const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

    return {
      publicKey: this.arrayBufferToPem(publicKey, 'PUBLIC KEY'),
      privateKey: this.arrayBufferToPem(privateKey, 'PRIVATE KEY'),
    };
  }

  /**
   * Sign payload with device private key
   */
  static async signWithDeviceKey(payload: QRPayload, deviceId: string): Promise<SignedQRPayload> {
    const device = await db.devices.get(deviceId);
    if (!device) {
      throw new Error('Device not found');
    }

    const privateKey = await this.importPrivateKey(device.privateKey);
    const payloadString = JSON.stringify(payload);
    const encoder = new TextEncoder();
    const data = encoder.encode(payloadString);

    const signature = await crypto.subtle.sign(
      {
        name: 'RSA-PSS',
        saltLength: 32,
      },
      privateKey,
      data
    );

    return {
      ...payload,
      signature: this.arrayBufferToHex(signature),
      signedBy: deviceId,
    };
  }

  /**
   * Import private key from PEM
   */
  private static async importPrivateKey(pem: string): Promise<CryptoKey> {
    const pemContents = pem
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\s/g, '');
    const binaryDer = this.base64ToArrayBuffer(pemContents);

    return await crypto.subtle.importKey(
      'pkcs8',
      binaryDer,
      {
        name: 'RSA-PSS',
        hash: 'SHA-256',
      },
      true,
      ['sign']
    );
  }

  /**
   * Convert ArrayBuffer to PEM format
   */
  private static arrayBufferToPem(buffer: ArrayBuffer, type: string): string {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    const pem = `-----BEGIN ${type}-----\n${base64.match(/.{1,64}/g)?.join('\n')}\n-----END ${type}-----`;
    return pem;
  }

  /**
   * Convert ArrayBuffer to hex string
   */
  private static arrayBufferToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Convert base64 to ArrayBuffer
   */
  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
