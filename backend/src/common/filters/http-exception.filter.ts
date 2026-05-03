import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Global HTTP exception filter.
 * Normalises all error responses to:
 * { success: false, error: { message: string, code: string, statusCode: number } }
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected error occurred';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const obj = exceptionResponse as Record<string, unknown>;
        // NestJS ValidationPipe returns { message: string[] } — join into one string
        if (Array.isArray(obj.message)) {
          message = (obj.message as string[]).join('; ');
        } else if (typeof obj.message === 'string') {
          message = obj.message;
        }
        if (typeof obj.error === 'string') {
          code = obj.error.toUpperCase().replace(/\s+/g, '_');
        }
      }

      // Derive a reasonable code from HTTP status
      code = code || HttpExceptionFilter.codeFromStatus(statusCode);
    } else if (exception instanceof Error) {
      message = exception.message || message;
      // Log unexpected errors at error level
      this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack);
    } else {
      this.logger.error('Unhandled non-Error exception', String(exception));
    }

    // Never leak internal error details in production for 5xx errors
    if (statusCode >= 500 && process.env.NODE_ENV === 'production') {
      message = 'An unexpected error occurred. Please try again later.';
    }

    response.status(statusCode).json({
      success: false,
      error: {
        message,
        code: code || HttpExceptionFilter.codeFromStatus(statusCode),
        statusCode,
      },
    });
  }

  private static codeFromStatus(status: number): string {
    switch (status) {
      case 400: return 'BAD_REQUEST';
      case 401: return 'UNAUTHORIZED';
      case 403: return 'FORBIDDEN';
      case 404: return 'NOT_FOUND';
      case 409: return 'CONFLICT';
      case 422: return 'UNPROCESSABLE_ENTITY';
      case 429: return 'TOO_MANY_REQUESTS';
      default: return status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR';
    }
  }
}
