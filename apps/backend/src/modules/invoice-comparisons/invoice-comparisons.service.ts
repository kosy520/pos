import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CompareInvoicesDto } from './dto/compare-invoices.dto';
import { QRService } from '../../common/utils/qr.service';

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

@Injectable()
export class InvoiceComparisonsService {
  constructor(private prisma: PrismaService) {}

  async compare(tenantId: string, dto: CompareInvoicesDto) {
    let sourceData: any;
    let targetData: any;

    // Load source data
    if (dto.sourceDraftId) {
      const draft = await this.prisma.invoiceDraft.findUnique({
        where: { id: dto.sourceDraftId },
        include: { lines: { include: { product: true } } },
      });
      sourceData = this.normalizeDraftData(draft);
    } else if (dto.sourceQrPayload) {
      const parsed = QRService.parseQRData(dto.sourceQrPayload);
      sourceData = this.normalizeQRData(parsed);
    }

    // Load target data
    if (dto.targetDraftId) {
      const draft = await this.prisma.invoiceDraft.findUnique({
        where: { id: dto.targetDraftId },
        include: { lines: { include: { product: true } } },
      });
      targetData = this.normalizeDraftData(draft);
    } else if (dto.targetQrPayload) {
      const parsed = QRService.parseQRData(dto.targetQrPayload);
      targetData = this.normalizeQRData(parsed);
    }

    // Compare
    const comparisonResult = this.performComparison(sourceData, targetData);

    // Store comparison
    const comparison = await this.prisma.invoiceComparison.create({
      data: {
        tenantId,
        sourceDraftId: dto.sourceDraftId || null,
        targetDraftId: dto.targetDraftId || null,
        sourceQrPayload: dto.sourceQrPayload || null,
        targetQrPayload: dto.targetQrPayload || null,
        comparisonResult: JSON.stringify(comparisonResult),
        status: comparisonResult.matched ? 'reconciled' : 'pending',
      },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        action: 'COMPARE_INVOICES',
        entityType: 'InvoiceComparison',
        entityId: comparison.id,
        changes: JSON.stringify({
          sourceDraftId: dto.sourceDraftId,
          targetDraftId: dto.targetDraftId,
          matched: comparisonResult.matched,
        }),
      },
    });

    return {
      comparison,
      result: comparisonResult,
    };
  }

  private normalizeDraftData(draft: any) {
    return {
      draftNumber: draft.draftNumber,
      totalAmount: draft.totalAmount,
      lines: draft.lines.map((line: any) => ({
        productSku: line.product.sku,
        productName: line.product.name,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        lineTotal: line.lineTotal,
      })),
    };
  }

  private normalizeQRData(qrPayload: any) {
    return {
      draftNumber: qrPayload.data.draftNumber,
      totalAmount: qrPayload.data.totalAmount,
      lines: qrPayload.data.lines,
    };
  }

  private performComparison(source: any, target: any): ComparisonResult {
    const differences: Array<{ field: string; source: any; target: any }> = [];

    // Compare totals
    if (source.totalAmount !== target.totalAmount) {
      differences.push({
        field: 'totalAmount',
        source: source.totalAmount,
        target: target.totalAmount,
      });
    }

    // Compare line counts
    if (source.lines.length !== target.lines.length) {
      differences.push({
        field: 'lineCount',
        source: source.lines.length,
        target: target.lines.length,
      });
    }

    // Compare lines (by product SKU)
    const sourceLinesBySku = new Map(
      source.lines.map((l: any) => [l.productSku, l]),
    );
    const targetLinesBySku = new Map(
      target.lines.map((l: any) => [l.productSku, l]),
    );

    // Check for missing or different lines
    for (const [sku, sourceLine] of sourceLinesBySku) {
      const targetLine = targetLinesBySku.get(sku);
      if (!targetLine) {
        differences.push({
          field: `line[${sku}]`,
          source: sourceLine,
          target: null,
        });
      } else {
        if (sourceLine.quantity !== targetLine.quantity) {
          differences.push({
            field: `line[${sku}].quantity`,
            source: sourceLine.quantity,
            target: targetLine.quantity,
          });
        }
        if (sourceLine.unitPrice !== targetLine.unitPrice) {
          differences.push({
            field: `line[${sku}].unitPrice`,
            source: sourceLine.unitPrice,
            target: targetLine.unitPrice,
          });
        }
      }
    }

    // Check for extra lines in target
    for (const [sku, targetLine] of targetLinesBySku) {
      if (!sourceLinesBySku.has(sku)) {
        differences.push({
          field: `line[${sku}]`,
          source: null,
          target: targetLine,
        });
      }
    }

    const criticalDifferences = differences.filter(
      d => d.field === 'totalAmount' || d.field.includes('quantity'),
    ).length;

    return {
      matched: differences.length === 0,
      differences,
      summary: {
        totalDifferences: differences.length,
        criticalDifferences,
      },
    };
  }

  async findById(comparisonId: string) {
    const comparison = await this.prisma.invoiceComparison.findUnique({
      where: { id: comparisonId },
      include: {
        sourceDraft: true,
        targetDraft: true,
      },
    });

    if (!comparison) {
      return null;
    }

    return {
      ...comparison,
      comparisonResult: JSON.parse(comparison.comparisonResult),
    };
  }
}
