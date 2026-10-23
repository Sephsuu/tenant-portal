import { ArgumentsHost, ForbiddenException } from '@nestjs/common';
import { createPrismaMock } from '../../test/prisma-mock.js';
import { MembersExceptionFilter } from './members-exception.filter.js';
import { MembersService } from './members.service.js';

const tenantId = '11111111-1111-4111-8111-111111111111';
const userId = '33333333-3333-4333-8333-333333333333';

describe('MembersService.list', () => {
  const prisma = createPrismaMock();
  const service = new MembersService(prisma);

  beforeEach(() => vi.clearAllMocks());

  it('returns only the selected tenant members with account status', async () => {
    prisma.tenantUser.findUnique.mockResolvedValue({ userId });
    prisma.tenantUser.count.mockResolvedValue(1);
    prisma.tenantUser.findMany.mockResolvedValue([
      {
        role: 'ADMIN',
        user: {
          id: userId,
          name: 'Alice Anderson',
          email: 'alice@example.com',
          status: 'ACTIVE',
        },
      },
    ]);

    await expect(service.list(tenantId, userId)).resolves.toEqual({
      members: [
        {
          id: userId,
          name: 'Alice Anderson',
          email: 'alice@example.com',
          status: 'ACTIVE',
          role: 'ADMIN',
        },
      ],
      page: 1,
      pageSize: 25,
      total: 1,
      totalPages: 1,
    });
    expect(prisma.tenantUser.findUnique.mock.calls[0][0]).toEqual({
      where: { tenantId_userId: { tenantId, userId } },
      select: { userId: true },
    });
    expect(prisma.tenantUser.findMany.mock.calls[0][0]).toEqual(
      expect.objectContaining({ where: { tenantId }, skip: 0, take: 25 }),
    );
    expect(prisma.$transaction.mock.calls[0][1]).toEqual({
      isolationLevel: 'RepeatableRead',
    });
  });

  it('returns empty pagination data when an authorized tenant has no members', async () => {
    prisma.tenantUser.findUnique.mockResolvedValue({ userId });
    prisma.tenantUser.count.mockResolvedValue(0);
    prisma.tenantUser.findMany.mockResolvedValue([]);
    await expect(service.list(tenantId, userId)).resolves.toEqual({
      members: [],
      page: 1,
      pageSize: 25,
      total: 0,
      totalPages: 0,
    });
  });

  it('requests only page two and returns the total number of pages', async () => {
    prisma.tenantUser.findUnique.mockResolvedValue({ userId });
    prisma.tenantUser.count.mockResolvedValue(51);
    prisma.tenantUser.findMany.mockResolvedValue([]);
    await expect(service.list(tenantId, userId, 2)).resolves.toEqual({
      members: [],
      page: 2,
      pageSize: 25,
      total: 51,
      totalPages: 3,
    });
    expect(prisma.tenantUser.findMany.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        where: { tenantId },
        skip: 25,
        take: 25,
        orderBy: [{ user: { name: 'asc' } }, { userId: 'asc' }],
      }),
    );
  });

  it('rejects nonmembers before reading any tenant data', async () => {
    prisma.tenantUser.findUnique.mockResolvedValue(null);
    await expect(service.list(tenantId, userId)).rejects.toThrow(
      ForbiddenException,
    );
    expect(prisma.tenantUser.findMany.mock.calls).toHaveLength(0);
    expect(prisma.tenantUser.count.mock.calls).toHaveLength(0);
  });

  it.each([0, -1, 1.5])(
    'rejects invalid page %s before querying',
    async (page) => {
      await expect(service.list(tenantId, userId, page)).rejects.toThrow(
        'Page must be a positive integer',
      );
      expect(prisma.$transaction.mock.calls).toHaveLength(0);
    },
  );

  it('rejects an out-of-range page before querying', async () => {
    await expect(
      service.list(tenantId, userId, Number.MAX_SAFE_INTEGER),
    ).rejects.toThrow('Page is out of range');
    expect(prisma.$transaction.mock.calls).toHaveLength(0);
  });
});

describe('MembersExceptionFilter', () => {
  it('returns the requested error response shape', () => {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({ getResponse: () => ({ status }) }),
    } as unknown as ArgumentsHost;

    new MembersExceptionFilter().catch(
      new ForbiddenException('You do not belong to this organization'),
      host,
    );

    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({
      success: false,
      message: 'You do not belong to this organization',
      error: 'FORBIDDEN',
      data: null,
    });
  });
});
