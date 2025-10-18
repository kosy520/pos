import { Test, TestingModule } from '@nestjs/testing';
import { SyncService } from '../sync.service';
import { PrismaService } from '../../prisma/prisma.service';
import { InvoiceDraftsService } from '../../invoice-drafts/invoice-drafts.service';
import { StockCountsService } from '../../stock-counts/stock-counts.service';
import { DevicesService } from '../../devices/devices.service';

describe('SyncService - Idempotency', () => {
  let service: SyncService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        {
          provide: PrismaService,
          useValue: {
            syncOperation: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            auditLog: {
              create: jest.fn(),
            },
          },
        },
        {
          provide: InvoiceDraftsService,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: StockCountsService,
          useValue: {
            createSession: jest.fn(),
          },
        },
        {
          provide: DevicesService,
          useValue: {
            updateLastSync: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SyncService>(SyncService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should process new operation successfully', async () => {
    const mockOperation = {
      opId: 'op-123',
      opType: 'CREATE_DRAFT',
      tempId: 'temp-456',
      payload: {
        draftNumber: 'D-001',
        lines: [],
      },
    };

    jest.spyOn(prismaService.syncOperation, 'findUnique')
      .mockResolvedValue(null);

    jest.spyOn(prismaService.syncOperation, 'create')
      .mockResolvedValue({
        id: 'sync-op-1',
        opId: 'op-123',
        serverId: 'draft-789',
        status: 'success',
      } as any);

    const invoiceDraftsService = (service as any).invoiceDraftsService;
    jest.spyOn(invoiceDraftsService, 'create')
      .mockResolvedValue({ id: 'draft-789' } as any);

    const devicesService = (service as any).devicesService;
    jest.spyOn(devicesService, 'updateLastSync')
      .mockResolvedValue({} as any);

    jest.spyOn(prismaService.auditLog, 'create')
      .mockResolvedValue({} as any);

    const result = await service.uploadBatch('tenant-1', {
      deviceId: 'device-1',
      operations: [mockOperation],
    });

    expect(result.summary.success).toBe(1);
    expect(result.summary.duplicates).toBe(0);
    expect(result.results[0].status).toBe('success');
    expect(result.results[0].serverId).toBe('draft-789');
  });

  it('should detect duplicate operation and return existing serverId', async () => {
    const mockOperation = {
      opId: 'op-123',
      opType: 'CREATE_DRAFT',
      tempId: 'temp-456',
      payload: {
        draftNumber: 'D-001',
        lines: [],
      },
    };

    const existingOp = {
      id: 'sync-op-1',
      opId: 'op-123',
      serverId: 'existing-draft-789',
      status: 'success',
    };

    jest.spyOn(prismaService.syncOperation, 'findUnique')
      .mockResolvedValue(existingOp as any);

    const devicesService = (service as any).devicesService;
    jest.spyOn(devicesService, 'updateLastSync')
      .mockResolvedValue({} as any);

    jest.spyOn(prismaService.auditLog, 'create')
      .mockResolvedValue({} as any);

    const result = await service.uploadBatch('tenant-1', {
      deviceId: 'device-1',
      operations: [mockOperation],
    });

    expect(result.summary.duplicates).toBe(1);
    expect(result.summary.success).toBe(0);
    expect(result.results[0].status).toBe('duplicate');
    expect(result.results[0].serverId).toBe('existing-draft-789');
  });

  it('should handle failed operations gracefully', async () => {
    const mockOperation = {
      opId: 'op-123',
      opType: 'CREATE_DRAFT',
      tempId: 'temp-456',
      payload: {
        draftNumber: 'D-001',
        lines: [],
      },
    };

    jest.spyOn(prismaService.syncOperation, 'findUnique')
      .mockResolvedValue(null);

    const invoiceDraftsService = (service as any).invoiceDraftsService;
    jest.spyOn(invoiceDraftsService, 'create')
      .mockRejectedValue(new Error('Database error'));

    jest.spyOn(prismaService.syncOperation, 'create')
      .mockResolvedValue({
        id: 'sync-op-1',
        opId: 'op-123',
        status: 'failed',
        errorMessage: 'Database error',
      } as any);

    const devicesService = (service as any).devicesService;
    jest.spyOn(devicesService, 'updateLastSync')
      .mockResolvedValue({} as any);

    jest.spyOn(prismaService.auditLog, 'create')
      .mockResolvedValue({} as any);

    const result = await service.uploadBatch('tenant-1', {
      deviceId: 'device-1',
      operations: [mockOperation],
    });

    expect(result.summary.failed).toBe(1);
    expect(result.results[0].status).toBe('failed');
    expect(result.results[0].errorMessage).toBe('Database error');
  });

  it('should process batch with mixed results', async () => {
    const operations = [
      { opId: 'op-1', opType: 'CREATE_DRAFT', tempId: 'temp-1', payload: {} },
      { opId: 'op-2', opType: 'CREATE_DRAFT', tempId: 'temp-2', payload: {} },
      { opId: 'op-3', opType: 'CREATE_DRAFT', tempId: 'temp-3', payload: {} },
    ];

    // op-1: new (success)
    // op-2: duplicate
    // op-3: new but fails

    jest.spyOn(prismaService.syncOperation, 'findUnique')
      .mockResolvedValueOnce(null) // op-1: new
      .mockResolvedValueOnce({ id: 'existing', opId: 'op-2', serverId: 'draft-2', status: 'success' } as any) // op-2: duplicate
      .mockResolvedValueOnce(null); // op-3: new

    const invoiceDraftsService = (service as any).invoiceDraftsService;
    jest.spyOn(invoiceDraftsService, 'create')
      .mockResolvedValueOnce({ id: 'draft-1' } as any) // op-1: success
      .mockRejectedValueOnce(new Error('Failed')); // op-3: fails

    jest.spyOn(prismaService.syncOperation, 'create')
      .mockResolvedValue({} as any);

    const devicesService = (service as any).devicesService;
    jest.spyOn(devicesService, 'updateLastSync')
      .mockResolvedValue({} as any);

    jest.spyOn(prismaService.auditLog, 'create')
      .mockResolvedValue({} as any);

    const result = await service.uploadBatch('tenant-1', {
      deviceId: 'device-1',
      operations,
    });

    expect(result.summary.total).toBe(3);
    expect(result.summary.success).toBe(1);
    expect(result.summary.duplicates).toBe(1);
    expect(result.summary.failed).toBe(1);
  });
});
