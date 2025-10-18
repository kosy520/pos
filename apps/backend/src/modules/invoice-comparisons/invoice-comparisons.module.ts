import { Module } from '@nestjs/common';
import { InvoiceComparisonsService } from './invoice-comparisons.service';
import { InvoiceComparisonsController } from './invoice-comparisons.controller';

@Module({
  providers: [InvoiceComparisonsService],
  controllers: [InvoiceComparisonsController],
  exports: [InvoiceComparisonsService],
})
export class InvoiceComparisonsModule {}
