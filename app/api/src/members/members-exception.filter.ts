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
    const message =
      exception instanceof HttpException
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
