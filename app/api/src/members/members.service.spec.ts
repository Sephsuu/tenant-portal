import {
  ArgumentsHost,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { Prisma, TenantRole } from '../generated/prisma/client.js';
import type { AuthenticatedRequest } from '../auth/auth.guard.js';
import { createPrismaMock } from '../../test/prisma-mock.js';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto.js';
import { MembersController } from './members.controller.js';
import { MembersExceptionFilter } from './members-exception.filter.js';
import { MembersService } from './members.service.js';

const tenantId = '11111111-1111-4111-8111-111111111111';
const userId = '33333333-3333-4333-8333-333333333333';
const adminId = '44444444-4444-4444-8444-444444444444';

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

  it('applies the same tenant, search, and role filters to count and page rows', async () => {
    prisma.tenantUser.findUnique.mockResolvedValue({ userId });
    prisma.tenantUser.count.mockResolvedValue(21);
    prisma.tenantUser.findMany.mockResolvedValue([]);

    await expect(
      service.list(tenantId, userId, 2, {
        pageSize: 20,
        search: '  ALICE  ',
        role: TenantRole.ADMIN,
      }),
    ).resolves.toMatchObject({
      page: 2,
      pageSize: 20,
      total: 21,
      totalPages: 2,
    });

    const where = {
      tenantId,
      role: TenantRole.ADMIN,
      OR: [
        { user: { name: { contains: 'ALICE', mode: 'insensitive' } } },
        { user: { email: { contains: 'ALICE', mode: 'insensitive' } } },
      ],
    };
    expect(prisma.tenantUser.count.mock.calls[0][0]).toEqual({ where });
    expect(prisma.tenantUser.findMany.mock.calls[0][0]).toMatchObject({
      where,
      skip: 20,
      take: 20,
    });
  });

  it.each([
    [{ pageSize: 0 }, 'Page size'],
    [{ pageSize: 101 }, 'Page size'],
    [{ role: 'OWNER' }, 'Role'],
    [{ search: 'x'.repeat(101) }, 'Search'],
  ])(
    'rejects invalid list filters before querying',
    async (filters, message) => {
      await expect(service.list(tenantId, userId, 1, filters)).rejects.toThrow(
        message,
      );
      expect(prisma.$transaction.mock.calls).toHaveLength(0);
    },
  );

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

describe('MembersService.updateRole', () => {
  const prisma = createPrismaMock();
  const service = new MembersService(prisma);

  beforeEach(() => vi.clearAllMocks());

  it('updates only the requested tenant membership and returns the member', async () => {
    prisma.tenantUser.findUnique
      .mockResolvedValueOnce({ role: TenantRole.ADMIN })
      .mockResolvedValueOnce({ userId });
    prisma.tenantUser.update.mockResolvedValue({
      role: TenantRole.ADMIN,
      user: {
        id: userId,
        name: 'Alice Anderson',
        email: 'alice@example.com',
        status: 'ACTIVE',
      },
    });

    await expect(
      service.updateRole(tenantId, userId, TenantRole.ADMIN, adminId),
    ).resolves.toEqual({
      id: userId,
      name: 'Alice Anderson',
      email: 'alice@example.com',
      status: 'ACTIVE',
      role: TenantRole.ADMIN,
    });
    expect(prisma.tenantUser.findUnique.mock.calls).toEqual([
      [
        {
          where: { tenantId_userId: { tenantId, userId: adminId } },
          select: { role: true },
        },
      ],
      [
        {
          where: { tenantId_userId: { tenantId, userId } },
          select: { userId: true },
        },
      ],
    ]);
    expect(prisma.tenantUser.update.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        where: { tenantId_userId: { tenantId, userId } },
        data: { role: TenantRole.ADMIN },
      }),
    );
    expect(prisma.$transaction.mock.calls[0][1]).toEqual({
      isolationLevel: 'Serializable',
    });
  });

  it('allows an admin to demote another admin', async () => {
    prisma.tenantUser.findUnique
      .mockResolvedValueOnce({ role: TenantRole.ADMIN })
      .mockResolvedValueOnce({ userId });
    prisma.tenantUser.update.mockResolvedValue({
      role: TenantRole.MEMBER,
      user: {
        id: userId,
        name: 'Alice',
        email: 'alice@example.com',
        status: 'ACTIVE',
      },
    });

    await expect(
      service.updateRole(tenantId, userId, TenantRole.MEMBER, adminId),
    ).resolves.toMatchObject({ id: userId, role: TenantRole.MEMBER });
    expect(prisma.tenantUser.update.mock.calls[0][0]).toEqual(
      expect.objectContaining({ data: { role: TenantRole.MEMBER } }),
    );
  });

  it.each([null, { role: TenantRole.MEMBER }])(
    'rejects a caller without a current admin membership',
    async (actor) => {
      prisma.tenantUser.findUnique.mockResolvedValue(actor);
      await expect(
        service.updateRole(tenantId, userId, TenantRole.ADMIN, adminId),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.tenantUser.update.mock.calls).toHaveLength(0);
    },
  );

  it('prevents an admin from demoting themself', async () => {
    prisma.tenantUser.findUnique.mockResolvedValue({ role: TenantRole.ADMIN });
    await expect(
      service.updateRole(tenantId, adminId, TenantRole.MEMBER, adminId),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.tenantUser.update.mock.calls).toHaveLength(0);
  });

  it('returns 404 for a member outside the selected tenant without writing', async () => {
    prisma.tenantUser.findUnique
      .mockResolvedValueOnce({ role: TenantRole.ADMIN })
      .mockResolvedValueOnce(null);
    await expect(
      service.updateRole(tenantId, userId, TenantRole.MEMBER, adminId),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.tenantUser.findUnique.mock.calls[1][0]).toEqual({
      where: { tenantId_userId: { tenantId, userId } },
      select: { userId: true },
    });
    expect(prisma.tenantUser.update.mock.calls).toHaveLength(0);
  });

  it.each([
    ['P2025', NotFoundException],
    ['P2034', ConflictException],
  ])('maps Prisma %s to a useful HTTP error', async (code, exception) => {
    prisma.tenantUser.findUnique
      .mockResolvedValueOnce({ role: TenantRole.ADMIN })
      .mockResolvedValueOnce({ userId });
    prisma.tenantUser.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Database error', {
        code,
        clientVersion: '7.10.1',
      }),
    );
    await expect(
      service.updateRole(tenantId, userId, TenantRole.MEMBER, adminId),
    ).rejects.toThrow(exception);
  });
});

describe('UpdateMemberRoleDto', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  const metadata = { type: 'body' as const, metatype: UpdateMemberRoleDto };

  it.each([TenantRole.ADMIN, TenantRole.MEMBER])(
    'accepts the supported role %s',
    async (role) => {
      await expect(pipe.transform({ role }, metadata)).resolves.toMatchObject({
        role,
      });
    },
  );

  it.each(['OWNER', '', null, 1, undefined])(
    'rejects unsupported role %s',
    async (role) => {
      await expect(pipe.transform({ role }, metadata)).rejects.toThrow(
        BadRequestException,
      );
    },
  );

  it('rejects extra role fields instead of applying a partial request', async () => {
    await expect(
      pipe.transform({ role: TenantRole.ADMIN, tenantId }, metadata),
    ).rejects.toThrow(BadRequestException);
  });
});

describe('MembersController.updateRole', () => {
  it('returns the standard success response with the updated member', async () => {
    const member = { id: userId, role: TenantRole.MEMBER };
    const updateRole = vi.fn().mockResolvedValue(member);
    const members = { updateRole } as unknown as MembersService;
    const controller = new MembersController(members);
    const request = {
      user: { sub: adminId },
    } as unknown as AuthenticatedRequest;

    await expect(
      controller.updateRole(
        tenantId,
        userId,
        { role: TenantRole.MEMBER },
        request,
      ),
    ).resolves.toEqual({
      success: true,
      message: 'Member role updated',
      error: null,
      data: member,
    });
    expect(updateRole.mock.calls).toEqual([
      [tenantId, userId, TenantRole.MEMBER, adminId],
    ]);
  });
});

describe('MembersController.list', () => {
  it('returns pagination metadata and forwards the authenticated user and filters', async () => {
    const data = {
      members: [],
      page: 2,
      pageSize: 20,
      total: 0,
      totalPages: 0,
    };
    const list = vi.fn().mockResolvedValue(data);
    const controller = new MembersController({
      list,
    } as unknown as MembersService);
    const request = { user: { sub: adminId } } as AuthenticatedRequest;

    await expect(
      controller.list(tenantId, request, 2, 20, 'alice', TenantRole.ADMIN),
    ).resolves.toEqual({
      success: true,
      message: 'Members loaded',
      error: null,
      data,
    });
    expect(list).toHaveBeenCalledWith(tenantId, adminId, 2, {
      pageSize: 20,
      search: 'alice',
      role: TenantRole.ADMIN,
    });
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

  it('includes validation details in the error message', () => {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({ getResponse: () => ({ status }) }),
    } as unknown as ArgumentsHost;

    new MembersExceptionFilter().catch(
      new BadRequestException({
        message: ['role must be one of ADMIN, MEMBER'],
      }),
      host,
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json.mock.calls[0][0]).toMatchObject({
      success: false,
      message: 'role must be one of ADMIN, MEMBER',
      error: 'BAD_REQUEST',
      data: null,
    });
  });
});
