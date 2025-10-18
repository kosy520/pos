import { IsString, IsArray, ValidateNested, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class InvoiceDraftLineDto {
  @IsString()
  productId: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPrice: number;
}

export class CreateInvoiceDraftDto {
  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsString()
  draftNumber: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceDraftLineDto)
  lines: InvoiceDraftLineDto[];
}

export class UpdateInvoiceDraftLinesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceDraftLineDto)
  lines: InvoiceDraftLineDto[];
}
