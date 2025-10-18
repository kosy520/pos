import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateStockCountSessionDto {
  @IsString()
  sessionNumber: string;

  @IsOptional()
  @IsString()
  deviceId?: string;
}

export class ScanProductDto {
  @IsString()
  productId: string;

  @IsNumber()
  quantity: number;
}

export class ReconcileStockDto {
  @IsNumber()
  expectedQuantity: number;
}
