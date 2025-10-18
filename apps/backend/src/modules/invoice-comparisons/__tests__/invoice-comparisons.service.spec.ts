import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceComparisonsService } from '../invoice-comparisons.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('InvoiceComparisonsService - Comparison Algorithm', () => {
  let service: InvoiceComparisonsService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceComparisonsService,
        {
          provide: PrismaService,
          useValue: {
            invoiceDraft: {
              findUnique: jest.fn(),
            },
            invoiceComparison: {
              create: jest.fn(),
            },
            auditLog: {
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<InvoiceComparisonsService>(InvoiceComparisonsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('performComparison normalization', () => {
    it('should match identical drafts', async () => {
      const mockDraft = {
        id: 'draft-1',
        draftNumber: 'D-001',
        totalAmount: 100,
        lines: [
          {
            product: { sku: 'SKU-1', name: 'Product 1' },
            quantity: 2,
            unitPrice: 50,
            lineTotal: 100,
          },
        ],
      };

      jest.spyOn(prismaService.invoiceDraft, 'findUnique')
        .mockResolvedValueOnce(mockDraft as any)
        .mockResolvedValueOnce(mockDraft as any);

      jest.spyOn(prismaService.invoiceComparison, 'create')
        .mockResolvedValue({
          id: 'comp-1',
          tenantId: 'tenant-1',
          comparisonResult: '{}',
          status: 'reconciled',
        } as any);

      jest.spyOn(prismaService.auditLog, 'create')
        .mockResolvedValue({} as any);

      const result = await service.compare('tenant-1', {
        sourceDraftId: 'draft-1',
        targetDraftId: 'draft-2',
      });

      expect(result.result.matched).toBe(true);
      expect(result.result.differences).toHaveLength(0);
    });

    it('should detect total amount differences', async () => {
      const sourceDraft = {
        id: 'draft-1',
        draftNumber: 'D-001',
        totalAmount: 100,
        lines: [
          {
            product: { sku: 'SKU-1', name: 'Product 1' },
            quantity: 2,
            unitPrice: 50,
            lineTotal: 100,
          },
        ],
      };

      const targetDraft = {
        ...sourceDraft,
        id: 'draft-2',
        totalAmount: 150,
      };

      jest.spyOn(prismaService.invoiceDraft, 'findUnique')
        .mockResolvedValueOnce(sourceDraft as any)
        .mockResolvedValueOnce(targetDraft as any);

      jest.spyOn(prismaService.invoiceComparison, 'create')
        .mockResolvedValue({
          id: 'comp-1',
          tenantId: 'tenant-1',
          comparisonResult: '{}',
          status: 'pending',
        } as any);

      jest.spyOn(prismaService.auditLog, 'create')
        .mockResolvedValue({} as any);

      const result = await service.compare('tenant-1', {
        sourceDraftId: 'draft-1',
        targetDraftId: 'draft-2',
      });

      expect(result.result.matched).toBe(false);
      expect(result.result.differences.length).toBeGreaterThan(0);
      expect(result.result.differences.some(d => d.field === 'totalAmount')).toBe(true);
    });

    it('should detect quantity differences', async () => {
      const sourceDraft = {
        id: 'draft-1',
        draftNumber: 'D-001',
        totalAmount: 100,
        lines: [
          {
            product: { sku: 'SKU-1', name: 'Product 1' },
            quantity: 2,
            unitPrice: 50,
            lineTotal: 100,
          },
        ],
      };

      const targetDraft = {
        id: 'draft-2',
        draftNumber: 'D-001',
        totalAmount: 100,
        lines: [
          {
            product: { sku: 'SKU-1', name: 'Product 1' },
            quantity: 3,
            unitPrice: 50,
            lineTotal: 150,
          },
        ],
      };

      jest.spyOn(prismaService.invoiceDraft, 'findUnique')
        .mockResolvedValueOnce(sourceDraft as any)
        .mockResolvedValueOnce(targetDraft as any);

      jest.spyOn(prismaService.invoiceComparison, 'create')
        .mockResolvedValue({
          id: 'comp-1',
          tenantId: 'tenant-1',
          comparisonResult: '{}',
          status: 'pending',
        } as any);

      jest.spyOn(prismaService.auditLog, 'create')
        .mockResolvedValue({} as any);

      const result = await service.compare('tenant-1', {
        sourceDraftId: 'draft-1',
        targetDraftId: 'draft-2',
      });

      expect(result.result.matched).toBe(false);
      const quantityDiff = result.result.differences.find(d => 
        d.field.includes('quantity')
      );
      expect(quantityDiff).toBeDefined();
    });

    it('should detect missing products', async () => {
      const sourceDraft = {
        id: 'draft-1',
        draftNumber: 'D-001',
        totalAmount: 100,
        lines: [
          {
            product: { sku: 'SKU-1', name: 'Product 1' },
            quantity: 2,
            unitPrice: 50,
            lineTotal: 100,
          },
          {
            product: { sku: 'SKU-2', name: 'Product 2' },
            quantity: 1,
            unitPrice: 25,
            lineTotal: 25,
          },
        ],
      };

      const targetDraft = {
        id: 'draft-2',
        draftNumber: 'D-001',
        totalAmount: 100,
        lines: [
          {
            product: { sku: 'SKU-1', name: 'Product 1' },
            quantity: 2,
            unitPrice: 50,
            lineTotal: 100,
          },
        ],
      };

      jest.spyOn(prismaService.invoiceDraft, 'findUnique')
        .mockResolvedValueOnce(sourceDraft as any)
        .mockResolvedValueOnce(targetDraft as any);

      jest.spyOn(prismaService.invoiceComparison, 'create')
        .mockResolvedValue({
          id: 'comp-1',
          tenantId: 'tenant-1',
          comparisonResult: '{}',
          status: 'pending',
        } as any);

      jest.spyOn(prismaService.auditLog, 'create')
        .mockResolvedValue({} as any);

      const result = await service.compare('tenant-1', {
        sourceDraftId: 'draft-1',
        targetDraftId: 'draft-2',
      });

      expect(result.result.matched).toBe(false);
      const missingProduct = result.result.differences.find(d => 
        d.field.includes('SKU-2')
      );
      expect(missingProduct).toBeDefined();
    });
  });
});
