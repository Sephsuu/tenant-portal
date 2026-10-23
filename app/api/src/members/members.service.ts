import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TenantRole } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    tenantId: string,
    userId: string,
    page = 1,
    filters: {
      pageSize?: number;
      search?: string;
      role?: string;
    } = {},
  ) {
    const pageSize = filters.pageSize ?? 25;
    if (!Number.isSafeInteger(page) || page < 1) {
      throw new BadRequestException('Page must be a positive integer');
    }
    if (![10, 20, 25, 30, 40, 50, 100].includes(pageSize)) {
      throw new BadRequestException(
        'Page size must be 10, 20, 30, 40, 50, or 100',
      );
    }
    if (
      filters.role &&
      filters.role !== TenantRole.ADMIN &&
      filters.role !== TenantRole.MEMBER
    ) {
      throw new BadRequestException('Role must be ADMIN or MEMBER');
    }
    if (
      filters.search !== undefined &&
      (typeof filters.search !== 'string' || filters.search.length > 100)
    ) {
      throw new BadRequestException('Search must be at most 100 characters');
    }
    if ((page - 1) * pageSize > 2_147_483_647) {
      throw new BadRequestException('Page is out of range');
    }

    const search = filters.search?.trim();
    const role =
      filters.role === TenantRole.ADMIN
        ? TenantRole.ADMIN
        : filters.role === TenantRole.MEMBER
          ? TenantRole.MEMBER
          : undefined;
    const where: Prisma.TenantUserWhereInput = {
      tenantId,
      ...(role && { role }),
      ...(search && {
        OR: [
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    return this.prisma.$transaction(
      async (db) => {
        const membership = await db.tenantUser.findUnique({
          where: { tenantId_userId: { tenantId, userId } },
          select: { userId: true },
        });
        if (!membership) {
          throw new ForbiddenException(
            'You do not belong to this organization',
          );
        }

        const total = await db.tenantUser.count({ where });
        const rows = await db.tenantUser.findMany({
          where,
          select: {
            role: true,
            user: {
              select: { id: true, name: true, email: true, status: true },
            },
          },
          orderBy: [{ user: { name: 'asc' } }, { userId: 'asc' }],
          skip: (page - 1) * pageSize,
          take: pageSize,
        });
        return {
          members: rows.map(({ role, user }) => ({ ...user, role })),
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        };
      },
      { isolationLevel: 'RepeatableRead' },
    );
  }

  async updateRole(
    tenantId: string,
    userId: string,
    role: TenantRole,
    actorId: string,
  ) {
    try {
      return await this.prisma.$transaction(
        async (db) => {
          const actor = await db.tenantUser.findUnique({
            where: { tenantId_userId: { tenantId, userId: actorId } },
            select: { role: true },
          });
          if (actor?.role !== TenantRole.ADMIN) {
            throw new ForbiddenException(
              'Only organization admins can change roles',
            );
          }
          if (actorId === userId && role !== TenantRole.ADMIN) {
            throw new BadRequestException(
              'You cannot remove your own admin access',
            );
          }

          const target = await db.tenantUser.findUnique({
            where: { tenantId_userId: { tenantId, userId } },
            select: { userId: true },
          });
          if (!target) {
            throw new NotFoundException(
              'Member not found in this organization',
            );
          }

          const updated = await db.tenantUser.update({
            where: { tenantId_userId: { tenantId, userId } },
            data: { role },
            select: {
              role: true,
              user: {
                select: { id: true, name: true, email: true, status: true },
              },
            },
          });
          return { ...updated.user, role: updated.role };
        },
        { isolationLevel: 'Serializable' },
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Member not found in this organization');
        }
        if (error.code === 'P2034') {
          throw new ConflictException(
            'Role changed concurrently. Please retry',
          );
        }
      }
      throw error;
    }
  }
}
