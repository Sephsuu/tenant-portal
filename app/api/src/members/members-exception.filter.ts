import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class MembersExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const response =
      exception instanceof HttpException ? exception.getResponse() : null;
    const detail =
      response && typeof response === 'object' && 'message' in response
        ? response.message
        : response;
    const message = Array.isArray(detail)
      ? detail.join('; ')
      : typeof detail === 'string'
        ? detail
        : exception instanceof HttpException
          ? exception.message
          : 'An unexpected error occurred';

    host
      .switchToHttp()
      .getResponse<Response>()
      .status(status)
      .json({
        success: false,
        message,
        error: HttpStatus[status] ?? 'INTERNAL_SERVER_ERROR',
        data: null,
      });
  }
}
