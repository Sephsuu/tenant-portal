import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';
import { isUUID } from 'class-validator';

export const TENANT_HEADER = 'x-tenant-id';

/** The header selects a tenant; authorization is checked against the database. */
export const CurrentTenant = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<Request>();
    const tenantId = request.header(TENANT_HEADER);
    if (!tenantId) {
      throw new BadRequestException(`Missing ${TENANT_HEADER} header`);
    }
    if (!isUUID(tenantId)) {
      throw new BadRequestException(`Invalid ${TENANT_HEADER} header`);
    }
    return tenantId;
  },
);
