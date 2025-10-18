import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SyncUploadDto, SyncResultDto } from './dto/sync.dto';
import { InvoiceDraftsService } from '../invoice-drafts/invoice-drafts.service';
import { StockCountsService } from '../stock-counts/stock-counts.service';
import { DevicesService } from '../devices/devices.service';

@Injectable()
export class SyncService {
  constructor(
    private prisma: PrismaService,
    private invoiceDraftsService: InvoiceDraftsService,
    private stockCountsService: StockCountsService,
    private devicesService: DevicesService,
  ) {}

  async uploadBatch(tenantId: string, dto: SyncUploadDto): Promise<{
    results: SyncResultDto[];
    summary: {
      total: number;
      success: number;
      failed: number;
      duplicates: number;
    };
  }> {
    const results: SyncResultDto[] = [];
    let successCount = 0;
    let failedCount = 0;
    let duplicateCount = 0;

    for (const operation of dto.operations) {
      try {
        // Check for duplicate operation (idempotency)
        const existingOp = await this.prisma.syncOperation.findUnique({
          where: {
            tenantId_deviceId_opId: {
              tenantId,
              deviceId: dto.deviceId,
              opId: operation.opId,
            },
          },
        });

        if (existingOp) {
          // Operation already processed
          results.push({
            opId: operation.opId,
            status: 'duplicate',
            serverId: existingOp.serverId,
            tempId: operation.tempId,
          });
          duplicateCount++;
          continue;
        }

        // Process operation
        const result = await this.processOperation(tenantId, dto.deviceId, operation);
        
        // Store sync operation record
        await this.prisma.syncOperation.create({
          data: {
            tenantId,
            deviceId: dto.deviceId,
            opId: operation.opId,
            opType: operation.opType,
            tempId: operation.tempId,
            serverId: result.serverId,
            status: 'success',
            processedAt: new Date(),
          },
        });

        results.push({
          opId: operation.opId,
          status: 'success',
          serverId: result.serverId,
          tempId: operation.tempId,
        });
        successCount++;
      } catch (error) {
        // Store failed operation
        await this.prisma.syncOperation.create({
          data: {
            tenantId,
            deviceId: dto.deviceId,
            opId: operation.opId,
            opType: operation.opType,
            tempId: operation.tempId,
            status: 'failed',
            errorMessage: error.message,
            processedAt: new Date(),
          },
        });

        results.push({
          opId: operation.opId,
          status: 'failed',
          tempId: operation.tempId,
          errorMessage: error.message,
        });
        failedCount++;
      }
    }

    // Update device last sync time
    await this.devicesService.updateLastSync(dto.deviceId);

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        tenantId,
        deviceId: dto.deviceId,
        action: 'SYNC_UPLOAD',
        entityType: 'SyncOperation',
        entityId: dto.deviceId,
        changes: JSON.stringify({
          total: dto.operations.length,
          success: successCount,
          failed: failedCount,
          duplicates: duplicateCount,
        }),
      },
    });

    return {
      results,
      summary: {
        total: dto.operations.length,
        success: successCount,
        failed: failedCount,
        duplicates: duplicateCount,
      },
    };
  }

  private async processOperation(
    tenantId: string,
    deviceId: string,
    operation: any,
  ): Promise<{ serverId: string }> {
    switch (operation.opType) {
      case 'CREATE_DRAFT':
        const draft = await this.invoiceDraftsService.create(tenantId, {
          ...operation.payload,
          deviceId,
        });
        return { serverId: draft.id };

      case 'UPDATE_DRAFT_LINES':
        const updatedDraft = await this.invoiceDraftsService.updateLines(
          tenantId,
          operation.payload.draftId,
          operation.payload,
        );
        return { serverId: updatedDraft.id };

      case 'CREATE_STOCK_COUNT':
        const session = await this.stockCountsService.createSession(tenantId, {
          ...operation.payload,
          deviceId,
        });
        return { serverId: session.id };

      case 'START_STOCK_COUNT':
        const startedSession = await this.stockCountsService.startSession(
          tenantId,
          operation.payload.sessionId,
        );
        return { serverId: startedSession.id };

      case 'SCAN_PRODUCT':
        const line = await this.stockCountsService.scanProduct(
          tenantId,
          operation.payload.sessionId,
          {
            productId: operation.payload.productId,
            quantity: operation.payload.quantity,
          },
        );
        return { serverId: line.id };

      case 'COMPLETE_STOCK_COUNT':
        const completedSession = await this.stockCountsService.completeSession(
          tenantId,
          operation.payload.sessionId,
        );
        return { serverId: completedSession.id };

      default:
        throw new Error(`Unknown operation type: ${operation.opType}`);
    }
  }
}
