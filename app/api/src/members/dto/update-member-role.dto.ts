import { IsEnum } from 'class-validator';
import { TenantRole } from '../../generated/prisma/client.js';

export class UpdateMemberRoleDto {
  @IsEnum(TenantRole)
  role: TenantRole;
}
