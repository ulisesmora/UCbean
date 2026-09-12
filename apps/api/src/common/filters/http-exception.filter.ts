import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<any>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException ? exception.message : 'Internal server error';

    // ValidationPipe puts the per-field failures in `response.message`, and
    // without them a rejected request says only "Bad Request Exception", which
    // tells the caller nothing about which field to fix.
    const body = exception instanceof HttpException ? exception.getResponse() : null;
    const details =
      body && typeof body === 'object' && Array.isArray((body as any).message)
        ? ((body as any).message as string[])
        : undefined;

    // An unexpected failure is a bug in here, not in the request. The client
    // is told nothing useful on purpose, so the stack has to reach the log or
    // it is lost entirely.
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      const req = ctx.getRequest<any>();
      this.logger.error(
        `${req?.method ?? '?'} ${req?.url ?? '?'} failed`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    reply.status(status).send({
      error: { status, message, details, timestamp: new Date().toISOString() },
    });
  }
}
