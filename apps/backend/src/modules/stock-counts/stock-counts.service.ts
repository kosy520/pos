import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateStockCountSessionDto,
  ScanProductDto,
  ReconcileStockDto,
} from './dto/stock-count.dto';

@Injectable()
export class StockCountsService {
  constructor(private prisma: PrismaService) {}

  async createSession(tenantId: string, dto: CreateStockCountSessionDto) {
    const session = await this.prisma.stockCountSession.create({
      data: {
        tenantId,
        deviceId: dto.deviceId || null,
        sessionNumber: dto.sessionNumber,
        status: 'draft',
      },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        deviceId: dto.deviceId || null,
        action: 'CREATE_STOCK_COUNT_SESSION',
        entityType: 'StockCountSession',
        entityId: session.id,
        changes: JSON.stringify(dto),
      },
    });

    return session;
  }

  async startSession(tenantId: string, sessionId: string) {
    const session = await this.prisma.stockCountSession.update({
      where: { id: sessionId },
      data: {
        status: 'in_progress',
        startedAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        action: 'START_STOCK_COUNT_SESSION',
        entityType: 'StockCountSession',
        entityId: sessionId,
      },
    });

    return session;
  }

  async scanProduct(tenantId: string, sessionId: string, dto: ScanProductDto) {
    const line = await this.prisma.stockCountLine.create({
      data: {
        sessionId,
        productId: dto.productId,
        countedQuantity: dto.quantity,
      },
      include: {
        product: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        action: 'SCAN_PRODUCT',
        entityType: 'StockCountLine',
        entityId: line.id,
        changes: JSON.stringify(dto),
      },
    });

    return line;
  }

  async reconcile(
    tenantId: string,
    sessionId: string,
    productId: string,
    dto: ReconcileStockDto,
  ) {
    // Get counted quantity
    const lines = await this.prisma.stockCountLine.findMany({
      where: { sessionId, productId },
    });

    const countedQuantity = lines.reduce(
      (sum, line) => sum + line.countedQuantity,
      0,
    );

    const adjustmentQuantity = countedQuantity - dto.expectedQuantity;

    const adjustment = await this.prisma.stockAdjustment.create({
      data: {
        sessionId,
        productId,
        expectedQuantity: dto.expectedQuantity,
        countedQuantity,
        adjustmentQuantity,
        reason: adjustmentQuantity !== 0 ? 'Stock count variance' : null,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        action: 'RECONCILE_STOCK',
        entityType: 'StockAdjustment',
        entityId: adjustment.id,
        changes: JSON.stringify({
          expectedQuantity: dto.expectedQuantity,
          countedQuantity,
          adjustmentQuantity,
        }),
      },
    });

    return adjustment;
  }

  async completeSession(tenantId: string, sessionId: string) {
    const session = await this.prisma.stockCountSession.update({
      where: { id: sessionId },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
      include: {
        lines: {
          include: {
            product: true,
          },
        },
        adjustments: {
          include: {
            product: true,
          },
        },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        action: 'COMPLETE_STOCK_COUNT_SESSION',
        entityType: 'StockCountSession',
        entityId: sessionId,
      },
    });

    return session;
  }

  async findById(sessionId: string) {
    return this.prisma.stockCountSession.findUnique({
      where: { id: sessionId },
      include: {
        lines: {
          include: {
            product: true,
          },
        },
        adjustments: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async listByTenant(tenantId: string) {
    return this.prisma.stockCountSession.findMany({
      where: { tenantId },
      include: {
        lines: true,
        adjustments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
