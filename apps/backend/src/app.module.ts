import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { DevicesModule } from './modules/devices/devices.module';
import { SyncModule } from './modules/sync/sync.module';
import { InvoiceDraftsModule } from './modules/invoice-drafts/invoice-drafts.module';
import { InvoiceComparisonsModule } from './modules/invoice-comparisons/invoice-comparisons.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { StockCountsModule } from './modules/stock-counts/stock-counts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { expiresIn: process.env.JWT_EXPIRATION || '24h' },
    }),
    PrismaModule,
    AuthModule,
    DevicesModule,
    SyncModule,
    InvoiceDraftsModule,
    InvoiceComparisonsModule,
    InvoicesModule,
    StockCountsModule,
  ],
})
export class AppModule {}
