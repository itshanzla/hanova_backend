import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private getResponseText(status: number, message: string | string[]): string {
    const msg = Array.isArray(message) ? message[0] : message;

    if (status === 401 && msg === 'Invalid credentials') {
      return 'Invalid Credentials';
    }


    if (status === 403 && msg === 'Access denied. Insufficient permissions.') {
      return 'Access Denied';
    }


    const statusMap: { [key: number]: string } = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      500: 'Internal Server Error',
    };

    return statusMap[status] || 'Error';
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || responseObj.error || 'An error occurred';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const responseText = this.getResponseText(status, message);

    const errorResponse = {
      status,
      response: responseText,
      message: Array.isArray(message) ? message.join(', ') : message,
      data: null,
    };

    response.status(status).json(errorResponse);
  }
}