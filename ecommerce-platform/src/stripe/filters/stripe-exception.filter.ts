import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { Stripe } from 'stripe';

type StripeError = Stripe.errors.StripeError & { type?: string };

@Catch()
export class StripeExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(StripeExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    const requestId = request.id; // Assuming request ID is set by a middleware

    // Default error response
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';
    let code: string | undefined;
    let type: string | undefined;

    // Handle Stripe errors
    if (this.isStripeError(exception)) {
      this.logger.error(
        `Stripe Error [${exception.type}]: ${exception.message}`,
        exception.stack,
      );

      status = this.getHttpStatusForStripeError(exception);
      message = exception.message;
      error = exception.type || 'Stripe Error';
      code = exception.code;
      type = exception.type;
    }
    // Handle HTTP exceptions
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse();
      message =
        typeof errorResponse === 'object' && errorResponse
          ? (errorResponse as any).message || exception.message
          : exception.message;
      error = exception.name;
    }
    // Handle other errors
    else if (exception instanceof Error) {
      this.logger.error(`Unexpected error: ${exception.message}`, exception.stack);
      message = process.env.NODE_ENV === 'production' ? 'Internal server error' : exception.message;
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
      ...(code && { code }),
      ...(type && { type }),
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
    });
  }

  private isStripeError(error: any): error is StripeError {
    return (
      error &&
      typeof error === 'object' &&
      'type' in error &&
      'code' in error &&
      'message' in error
    );
  }

  private getHttpStatusForStripeError(error: StripeError): number {
    switch (error.type) {
      case 'StripeCardError':
        // A declined card, etc.
        return HttpStatus.BAD_REQUEST;
      case 'StripeRateLimitError':
        // Too many requests made to the API too quickly
        return HttpStatus.TOO_MANY_REQUESTS;
      case 'StripeInvalidRequestError':
        // Invalid parameters were supplied to Stripe's API
        return HttpStatus.BAD_REQUEST;
      case 'StripeAPIError':
        // An error occurred internally with Stripe's API
        return HttpStatus.INTERNAL_SERVER_ERROR;
      case 'StripeConnectionError':
        // Some kind of error occurred during the HTTPS communication
        return HttpStatus.SERVICE_UNAVAILABLE;
      case 'StripeAuthenticationError':
        // You probably used an incorrect API key
        return HttpStatus.UNAUTHORIZED;
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }
}
