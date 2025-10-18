import { Controller, Post, Patch, Get, Body, Param, UseGuards } from '@nestjs/common';
import { InvoiceDraftsService } from './invoice-drafts.service';
import { CreateInvoiceDraftDto, UpdateInvoiceDraftLinesDto } from './dto/invoice-draft.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('tenants/:tenantId/invoice-drafts')
@UseGuards(JwtAuthGuard)
export class InvoiceDraftsController {
  constructor(private invoiceDraftsService: InvoiceDraftsService) {}

  @Post()
  async create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateInvoiceDraftDto,
  ) {
    return this.invoiceDraftsService.create(tenantId, dto);
  }

  @Patch(':id/lines')
  async updateLines(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDraftLinesDto,
  ) {
    return this.invoiceDraftsService.updateLines(tenantId, id, dto);
  }

  @Post(':id/generate-qr')
  async generateQR(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.invoiceDraftsService.generateQR(tenantId, id);
  }

  @Get()
  async list(@Param('tenantId') tenantId: string) {
    return this.invoiceDraftsService.listByTenant(tenantId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.invoiceDraftsService.findById(id);
  }
}
