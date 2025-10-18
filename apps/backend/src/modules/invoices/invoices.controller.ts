import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateFinalInvoiceDto } from './dto/create-final-invoice.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('tenants/:tenantId/invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

  @Post('from-comparison')
  async createFromComparison(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateFinalInvoiceDto,
  ) {
    return this.invoicesService.createFromComparison(tenantId, dto);
  }

  @Get()
  async list(@Param('tenantId') tenantId: string) {
    return this.invoicesService.listByTenant(tenantId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.invoicesService.findById(id);
  }
}
