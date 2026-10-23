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
    prisma.tenant.findFirst.mockResolvedValue({
      users: [
        {
          role: 'ADMIN',
          user: {
            id: userId,
            name: 'Alice Anderson',
            email: 'alice@example.com',
            status: 'ACTIVE',
          },
        },
      ],
    });

    await expect(service.list(tenantId, userId)).resolves.toEqual([
      {
        id: userId,
        name: 'Alice Anderson',
        email: 'alice@example.com',
        status: 'ACTIVE',
        role: 'ADMIN',
      },
    ]);
    expect(prisma.tenant.findFirst.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        where: { id: tenantId, users: { some: { userId } } },
      }),
    );
  });

  it('returns an empty array when an authorized tenant has no members', async () => {
    prisma.tenant.findFirst.mockResolvedValue({ users: [] });
    await expect(service.list(tenantId, userId)).resolves.toEqual([]);
  });

  it('rejects nonmembers before reading any tenant data', async () => {
    prisma.tenant.findFirst.mockResolvedValue(null);
    await expect(service.list(tenantId, userId)).rejects.toThrow(
      ForbiddenException,
    );
    expect(prisma.tenantUser.findMany.mock.calls).toHaveLength(0);
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
