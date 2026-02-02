import { Injectable, Logger, UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Support cookies + headers
    if (request.cookies?.token && !request.headers.authorization) {
      request.headers.authorization = `Bearer ${request.cookies.token}`;
    }
    
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      const message = info?.message || 'Authentication required';
      this.logger.warn(`Authentication failed: ${message}`);
      throw new UnauthorizedException(message);
    }
    
    return user;
  }
}
