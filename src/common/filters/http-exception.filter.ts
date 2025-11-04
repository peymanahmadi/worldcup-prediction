import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorResponse: any;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        errorResponse = exceptionResponse;
      } else {
        errorResponse = {
          success: false,
          error: {
            code: 'HTTP_EXCEPTION',
            message: exceptionResponse,
            statusCode: status,
          },
        };
      }
    } else {
      // Log unexpected errors
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );

      errorResponse = {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message:
            process.env.NODE_ENV === 'production'
              ? 'An unexpected error occurred'
              : exception.message,
          statusCode: status,
        },
      };
    }

    // Add timestamp
    errorResponse.timestamp = new Date().toISOString();

    // Add request path
    errorResponse.path = request.url;

    response.status(status).json(errorResponse);
  }
}
