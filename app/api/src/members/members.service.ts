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

  async list(tenantId: string, userId: string, page = 1) {
    const pageSize = 25;
    if (!Number.isSafeInteger(page) || page < 1) {
      throw new BadRequestException('Page must be a positive integer');
    }
    if ((page - 1) * pageSize > 2_147_483_647) {
      throw new BadRequestException('Page is out of range');
    }

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

        const total = await db.tenantUser.count({ where: { tenantId } });
        const rows = await db.tenantUser.findMany({
          where: { tenantId },
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
