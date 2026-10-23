import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard.js';
import { CurrentTenant } from '../tenancy/current-tenant.decorator.js';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto.js';
import { MembersService } from './members.service.js';
import { MembersExceptionFilter } from './members-exception.filter.js';

@Controller('members')
@UseGuards(AuthGuard)
@UseFilters(MembersExceptionFilter)
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @Get()
  async list(
    @CurrentTenant() tenantId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    const data = await this.members.list(
      tenantId, 
      request.user.sub
    );

    return { 
      success: true, 
      message: 'Members loaded', 
      error: null, data 
    };
  }

  @Patch(':userId')
  updateRole(
    @CurrentTenant() tenantId: string,
    @Param('userId') userId: string,
    @Body() body: UpdateMemberRoleDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.members.updateRole(tenantId, userId, body.role, request.user);
  }
}
