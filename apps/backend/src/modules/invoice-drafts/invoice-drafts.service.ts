import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDraftDto, UpdateInvoiceDraftLinesDto } from './dto/invoice-draft.dto';
import { QRService, QRPayload } from '../../common/utils/qr.service';

@Injectable()
export class InvoiceDraftsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateInvoiceDraftDto) {
    const totalAmount = dto.lines.reduce(
      (sum, line) => sum + line.quantity * line.unitPrice,
      0,
    );

    const draft = await this.prisma.invoiceDraft.create({
      data: {
        tenantId,
        deviceId: dto.deviceId || null,
        draftNumber: dto.draftNumber,
        totalAmount,
        status: 'draft',
        lines: {
          create: dto.lines.map(line => ({
            productId: line.productId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            lineTotal: line.quantity * line.unitPrice,
          })),
        },
      },
      include: {
        lines: {
          include: {
            product: true,
          },
        },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        deviceId: dto.deviceId || null,
        action: 'CREATE_DRAFT',
        entityType: 'InvoiceDraft',
        entityId: draft.id,
        changes: JSON.stringify(dto),
      },
    });

    return draft;
  }

  async updateLines(tenantId: string, draftId: string, dto: UpdateInvoiceDraftLinesDto) {
    // Delete existing lines
    await this.prisma.invoiceDraftLine.deleteMany({
      where: { draftId },
    });

    // Calculate new total
    const totalAmount = dto.lines.reduce(
      (sum, line) => sum + line.quantity * line.unitPrice,
      0,
    );

    // Update draft with new lines
    const draft = await this.prisma.invoiceDraft.update({
      where: { id: draftId },
      data: {
        totalAmount,
        lines: {
          create: dto.lines.map(line => ({
            productId: line.productId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            lineTotal: line.quantity * line.unitPrice,
          })),
        },
      },
      include: {
        lines: {
          include: {
            product: true,
          },
        },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        action: 'UPDATE_DRAFT_LINES',
        entityType: 'InvoiceDraft',
        entityId: draftId,
        changes: JSON.stringify(dto),
      },
    });

    return draft;
  }

  async generateQR(tenantId: string, draftId: string) {
    const draft = await this.prisma.invoiceDraft.findUnique({
      where: { id: draftId },
      include: { lines: { include: { product: true } } },
    });

    if (!draft) {
      throw new Error('Draft not found');
    }

    // Get tenant secret
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    const payload: QRPayload = {
      type: 'invoice_draft',
      draftId: draft.id,
      tenantId,
      data: {
        draftNumber: draft.draftNumber,
        totalAmount: draft.totalAmount,
        lines: draft.lines.map(line => ({
          productSku: line.product.sku,
          productName: line.product.name,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          lineTotal: line.lineTotal,
        })),
      },
      timestamp: Date.now(),
    };

    const signedPayload = QRService.signWithTenantSecret(payload, tenant.signingSecret);
    const qrDataUrl = await QRService.generateQRCode(signedPayload);

    // Update draft with QR data
    const updatedDraft = await this.prisma.invoiceDraft.update({
      where: { id: draftId },
      data: {
        qrPayload: JSON.stringify(payload),
        qrSignature: signedPayload.signature,
        signedBy: 'server',
        status: 'provisional',
      },
    });

    return {
      draft: updatedDraft,
      qrCode: qrDataUrl,
      signedPayload,
    };
  }

  async findById(draftId: string) {
    return this.prisma.invoiceDraft.findUnique({
      where: { id: draftId },
      include: {
        lines: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async listByTenant(tenantId: string) {
    return this.prisma.invoiceDraft.findMany({
      where: { tenantId },
      include: {
        lines: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
