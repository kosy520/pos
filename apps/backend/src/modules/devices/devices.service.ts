import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDeviceDto } from './dto/register-device.dto';

@Injectable()
export class DevicesService {
  constructor(private prisma: PrismaService) {}

  async register(tenantId: string, dto: RegisterDeviceDto) {
    const device = await this.prisma.device.create({
      data: {
        tenantId,
        deviceName: dto.deviceName,
        publicKey: dto.publicKey,
        isActive: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        deviceId: device.id,
        action: 'REGISTER_DEVICE',
        entityType: 'Device',
        entityId: device.id,
        changes: JSON.stringify({ deviceName: dto.deviceName }),
      },
    });

    return device;
  }

  async findById(deviceId: string) {
    return this.prisma.device.findUnique({
      where: { id: deviceId },
    });
  }

  async updateLastSync(deviceId: string) {
    return this.prisma.device.update({
      where: { id: deviceId },
      data: { lastSyncAt: new Date() },
    });
  }

  async listByTenant(tenantId: string) {
    return this.prisma.device.findMany({
      where: { tenantId, isActive: true },
      orderBy: { registeredAt: 'desc' },
    });
  }
}
