import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let code: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const res = exceptionResponse as Record<string, any>;
        message = res.message || exception.message;
        // Preservar campo 'code' para que el frontend pueda distinguir
        // casos especiales como FUTURE_RESERVATION_WARNING o TERRITORY_VIOLATION.
        if (res.code) code = String(res.code);
      }
    } else if (exception instanceof Error) {
      const isFK = exception.message?.includes('viola la llave foránea')
                || exception.message?.includes('violates foreign key');
      if (isFK) {
        status = HttpStatus.BAD_REQUEST;
        message = 'Los datos enviados hacen referencia a registros que ya no existen. Intenta de nuevo.';
        this.logger.warn(`FK violation: ${exception.message}`);
      } else {
        message = exception.message;
        this.logger.error(
          `Unhandled exception: ${exception.message}`,
          exception.stack,
        );
      }
    }

    const body: Record<string, unknown> = {
      success: false,
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };
    if (code) body.code = code;

    response.status(status).json(body);
  }
}
