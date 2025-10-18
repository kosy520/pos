import { IsString, IsOptional } from 'class-validator';

export class CompareInvoicesDto {
  @IsOptional()
  @IsString()
  sourceDraftId?: string;

  @IsOptional()
  @IsString()
  targetDraftId?: string;

  @IsOptional()
  @IsString()
  sourceQrPayload?: string;

  @IsOptional()
  @IsString()
  targetQrPayload?: string;
}
