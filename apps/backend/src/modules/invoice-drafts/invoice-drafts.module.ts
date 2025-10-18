import { Module } from '@nestjs/common';
import { InvoiceDraftsService } from './invoice-drafts.service';
import { InvoiceDraftsController } from './invoice-drafts.controller';

@Module({
  providers: [InvoiceDraftsService],
  controllers: [InvoiceDraftsController],
  exports: [InvoiceDraftsService],
})
export class InvoiceDraftsModule {}
