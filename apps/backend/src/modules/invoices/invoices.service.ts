import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFinalInvoiceDto } from './dto/create-final-invoice.dto';
import { QRService, QRPayload } from '../../common/utils/qr.service';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async createFromComparison(tenantId: string, dto: CreateFinalInvoiceDto) {
    // Load comparison
    const comparison = await this.prisma.invoiceComparison.findUnique({
      where: { id: dto.comparisonId },
      include: {
        sourceDraft: {
          include: {
            lines: {
              include: {
                product: true,
              },
            },
          },
        },
        targetDraft: {
          include: {
            lines: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!comparison) {
      throw new Error('Comparison not found');
    }

    if (comparison.status !== 'reconciled') {
      throw new Error('Comparison must be reconciled before creating final invoice');
    }

    // Use source draft as base for final invoice
    const baseDraft = comparison.sourceDraft || comparison.targetDraft;
    
    if (!baseDraft) {
      throw new Error('No draft found in comparison');
    }

    // Get tenant secret for signing
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    const invoiceData = {
      invoiceNumber: dto.invoiceNumber,
      draftNumber: baseDraft.draftNumber,
      totalAmount: baseDraft.totalAmount,
      lines: baseDraft.lines.map(line => ({
        productSku: line.product.sku,
        productName: line.product.name,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        lineTotal: line.lineTotal,
      })),
      createdAt: new Date().toISOString(),
    };

    const payload: QRPayload = {
      type: 'invoice_final',
      invoiceId: dto.invoiceNumber,
      tenantId,
      data: invoiceData,
      timestamp: Date.now(),
    };

    const signedPayload = QRService.signWithTenantSecret(payload, tenant.signingSecret);
    const qrDataUrl = await QRService.generateQRCode(signedPayload);

    // Create final invoice
    const finalInvoice = await this.prisma.invoiceFinal.create({
      data: {
        tenantId,
        comparisonId: dto.comparisonId,
        invoiceNumber: dto.invoiceNumber,
        totalAmount: baseDraft.totalAmount,
        qrPayload: JSON.stringify(payload),
        qrSignature: signedPayload.signature,
        invoiceData: JSON.stringify(invoiceData),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        action: 'CREATE_FINAL_INVOICE',
        entityType: 'InvoiceFinal',
        entityId: finalInvoice.id,
        changes: JSON.stringify({
          comparisonId: dto.comparisonId,
          invoiceNumber: dto.invoiceNumber,
        }),
      },
    });

    return {
      invoice: finalInvoice,
      qrCode: qrDataUrl,
      signedPayload,
    };
  }

  async findById(invoiceId: string) {
    const invoice = await this.prisma.invoiceFinal.findUnique({
      where: { id: invoiceId },
      include: {
        comparison: true,
      },
    });

    if (!invoice) {
      return null;
    }

    return {
      ...invoice,
      invoiceData: JSON.parse(invoice.invoiceData),
    };
  }

  async listByTenant(tenantId: string) {
    return this.prisma.invoiceFinal.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
