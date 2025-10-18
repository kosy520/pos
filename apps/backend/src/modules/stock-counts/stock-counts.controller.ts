import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { StockCountsService } from './stock-counts.service';
import {
  CreateStockCountSessionDto,
  ScanProductDto,
  ReconcileStockDto,
} from './dto/stock-count.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('tenants/:tenantId/stock-counts')
@UseGuards(JwtAuthGuard)
export class StockCountsController {
  constructor(private stockCountsService: StockCountsService) {}

  @Post()
  async create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateStockCountSessionDto,
  ) {
    return this.stockCountsService.createSession(tenantId, dto);
  }

  @Post(':id/start')
  async start(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.stockCountsService.startSession(tenantId, id);
  }

  @Post(':id/scan')
  async scan(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: ScanProductDto,
  ) {
    return this.stockCountsService.scanProduct(tenantId, id, dto);
  }

  @Post(':id/reconcile/:productId')
  async reconcile(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Body() dto: ReconcileStockDto,
  ) {
    return this.stockCountsService.reconcile(tenantId, id, productId, dto);
  }

  @Post(':id/complete')
  async complete(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.stockCountsService.completeSession(tenantId, id);
  }

  @Get()
  async list(@Param('tenantId') tenantId: string) {
    return this.stockCountsService.listByTenant(tenantId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.stockCountsService.findById(id);
  }
}
