import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/user.decorator';

@Controller('tenants/:tenantId/devices')
@UseGuards(JwtAuthGuard)
export class DevicesController {
  constructor(private devicesService: DevicesService) {}

  @Post('register')
  async register(
    @Param('tenantId') tenantId: string,
    @Body() dto: RegisterDeviceDto,
  ) {
    return this.devicesService.register(tenantId, dto);
  }

  @Get()
  async list(@Param('tenantId') tenantId: string) {
    return this.devicesService.listByTenant(tenantId);
  }
}
