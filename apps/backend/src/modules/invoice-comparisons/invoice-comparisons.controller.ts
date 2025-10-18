import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { InvoiceComparisonsService } from './invoice-comparisons.service';
import { CompareInvoicesDto } from './dto/compare-invoices.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('tenants/:tenantId/invoice-comparisons')
@UseGuards(JwtAuthGuard)
export class InvoiceComparisonsController {
  constructor(private invoiceComparisonsService: InvoiceComparisonsService) {}

  @Post()
  async compare(
    @Param('tenantId') tenantId: string,
    @Body() dto: CompareInvoicesDto,
  ) {
    return this.invoiceComparisonsService.compare(tenantId, dto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.invoiceComparisonsService.findById(id);
  }
}
