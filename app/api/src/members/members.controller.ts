import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Query,
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
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(25), ParseIntPipe) pageSize: number,
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    const data = await this.members.list(tenantId, request.user.sub, page, {
      pageSize,
      search,
      role,
    });
    return { success: true, message: 'Members loaded', error: null, data };
  }

  @Patch(':userId')
  async updateRole(
    @CurrentTenant() tenantId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() body: UpdateMemberRoleDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const data = await this.members.updateRole(
      tenantId,
      userId,
      body.role,
      request.user.sub,
    );
    return { success: true, message: 'Member role updated', error: null, data };
  }
}
