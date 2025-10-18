import { IsString } from 'class-validator';

export class CreateFinalInvoiceDto {
  @IsString()
  comparisonId: string;

  @IsString()
  invoiceNumber: string;
}
