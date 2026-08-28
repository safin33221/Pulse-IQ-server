import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';

import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();

    let message = 'Database error';
    let statusCode = 400;

    switch (exception.code) {
      case 'P2002':
        message = 'Record already exists';
        break;

      case 'P2025':
        message = 'Record not found';
        statusCode = 404;
        break;
    }

    response.status(statusCode).json({
      statusCode,

      message,

      timestamp: new Date().toISOString(),
    });
  }
}
