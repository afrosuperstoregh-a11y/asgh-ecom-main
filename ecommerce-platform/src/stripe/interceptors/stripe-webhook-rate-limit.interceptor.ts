import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RateLimiterMemory } from 'rate-limiter-flexible';

type RateLimiterResponse = {
  remainingPoints: number;
  msBeforeNext: number;
  consumedPoints: number;
  isFirstInDuration: boolean;
};

@Injectable()
export class StripeWebhookRateLimitInterceptor implements NestInterceptor {
  private readonly logger = new Logger(StripeWebhookRateLimitInterceptor.name);
  private rateLimiter: RateLimiterMemory;

  constructor() {
    // Allow 10 requests per IP per minute for webhook endpoints
    this.rateLimiter = new RateLimiterMemory({
      points: 10, // Number of points
      duration: 60, // Per second
      blockDuration: 300, // Block for 5 minutes if rate limit is exceeded
    });
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const response = httpContext.getResponse();
    const clientIp = this.getClientIp(request);
    const key = `webhook_${clientIp}`;

    try {
      await this.rateLimiter.consume(key);
      return next.handle().pipe(
        tap({
          error: (error) => {
            // Log errors but don't consume a point on errors
            if (error instanceof HttpException && error.getStatus() >= 500) {
              this.rateLimiter.delete(key);
            }
          },
        }),
      );
    } catch (rateLimiterRes: unknown) {
      const rateLimitInfo = rateLimiterRes as RateLimiterResponse;
      this.logger.warn(
        `Rate limit exceeded for IP: ${clientIp}, route: ${request.url}, ` +
        `remaining: ${rateLimitInfo.remainingPoints}, ` +
        `msBeforeNext: ${rateLimitInfo.msBeforeNext}`,
      );
      
      response.setHeader('Retry-After', Math.ceil(rateLimitInfo.msBeforeNext / 1000));
      throw new HttpException(
        { 
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too Many Requests',
          retryAfter: Math.ceil(rateLimitInfo.msBeforeNext / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private getClientIp(req: any): string {
    // Get the client's IP address, considering various headers and proxies
    const xForwardedFor = req.headers['x-forwarded-for'] as string | string[] | undefined;
    
    if (Array.isArray(xForwardedFor)) {
      return xForwardedFor[0].split(',').shift()?.trim() || 'unknown';
    } else if (xForwardedFor) {
      return xForwardedFor.split(',').shift()?.trim() || 'unknown';
    }
    
    // Fallback to other IP sources
    const socket = req.socket || (req as any).connection?.socket;
    return (socket?.remoteAddress as string) || 'unknown';
  }
}
