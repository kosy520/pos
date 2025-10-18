import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncUploadDto } from './dto/sync.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('tenants/:tenantId/sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private syncService: SyncService) {}

  @Post('upload')
  async upload(
    @Param('tenantId') tenantId: string,
    @Body() dto: SyncUploadDto,
  ) {
    return this.syncService.uploadBatch(tenantId, dto);
  }
}
