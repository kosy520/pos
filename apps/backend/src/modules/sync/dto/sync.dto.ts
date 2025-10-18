import { IsString, IsArray, ValidateNested, IsObject, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class SyncOperationDto {
  @IsString()
  opId: string; // Client-provided operation ID for idempotency

  @IsString()
  opType: string; // e.g., 'CREATE_DRAFT', 'UPDATE_STOCK_COUNT', 'SCAN_PRODUCT'

  @IsOptional()
  @IsString()
  tempId?: string; // Client's temporary ID

  @IsObject()
  payload: any; // Operation-specific data
}

export class SyncUploadDto {
  @IsString()
  deviceId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncOperationDto)
  operations: SyncOperationDto[];
}

export class SyncResultDto {
  opId: string;
  status: 'success' | 'failed' | 'duplicate';
  serverId?: string;
  tempId?: string;
  errorMessage?: string;
}
