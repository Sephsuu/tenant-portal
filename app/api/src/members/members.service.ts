import {
  ForbiddenException,
  Injectable,
  NotImplementedException,
} from '@nestjs/common';
import type { JwtPayload } from '../auth/auth.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string, userId: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId, users: { some: { userId } } },
      select: {
        users: {
          select: {
            role: true,
            user: {
              select: { id: true, name: true, email: true, status: true },
            },
          },
          orderBy: { user: { name: 'asc' } },
        },
      },
    });
    if (!tenant) {
      throw new ForbiddenException('You do not belong to this organization');
    }
    return tenant.users.map(({ role, user }) => ({ ...user, role }));
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
