import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotImplementedException,
} from '@nestjs/common';
import type { JwtPayload } from '../auth/auth.guard.js';
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

  // TODO: change a member's role. Only tenant admins may do this (see isTenantAdmin)
  updateRole(
    tenantId: string,
    userId: string,
    role: string,
    actor: JwtPayload,
  ) {
    throw new NotImplementedException(
      `Set ${userId} to ${role} in ${tenantId} by ${actor.sub}`,
    );
  }
}
