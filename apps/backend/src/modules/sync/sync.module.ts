import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { InvoiceDraftsModule } from '../invoice-drafts/invoice-drafts.module';
import { StockCountsModule } from '../stock-counts/stock-counts.module';
import { DevicesModule } from '../devices/devices.module';

@Module({
  imports: [InvoiceDraftsModule, StockCountsModule, DevicesModule],
  providers: [SyncService],
  controllers: [SyncController],
  exports: [SyncService],
})
export class SyncModule {}
