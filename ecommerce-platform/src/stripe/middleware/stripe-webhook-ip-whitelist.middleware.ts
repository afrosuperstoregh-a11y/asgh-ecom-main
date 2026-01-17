import { Injectable, NestMiddleware, ForbiddenException, Inject } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Logger } from '@nestjs/common';
import { STRIPE_CONFIG } from '../stripe.constants';
import type { StripeConfig } from '../config/stripe.config';

@Injectable()
export class StripeWebhookIpWhitelistMiddleware implements NestMiddleware {
  private readonly logger = new Logger(StripeWebhookIpWhitelistMiddleware.name);
  private readonly allowedIps: string[] = [];
  private lastIpFetchTime: number = 0;
  private readonly IP_REFRESH_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

  private stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    @Inject(STRIPE_CONFIG) private readonly stripeConfig: StripeConfig,
  ) {
    this.stripe = new Stripe(this.stripeConfig.secretKey, {
      apiVersion: this.stripeConfig.apiVersion as any,
    });
    
    this.initializeIps().catch((err) =>
      this.logger.error('Failed to initialize Stripe IP whitelist', err),
    );
  }

  async use(req: Request, res: Response, next: NextFunction) {
    // Skip IP check in development or test environments
    if (['development', 'test'].includes(process.env.NODE_ENV || '')) {
      return next();
    }

    const clientIp = this.getClientIp(req);
    
    // Refresh IPs if cache is stale
    if (Date.now() - this.lastIpFetchTime > this.IP_REFRESH_INTERVAL) {
      await this.refreshIps();
    }

    // Check if IP is in the allowed list or a subnet
    const isAllowed = this.allowedIps.some(ip => {
      if (ip === clientIp) return true;
      // Handle CIDR notation (e.g., 192.168.1.0/24)
      if (ip.includes('/')) {
        return this.isIpInCidr(clientIp, ip);
      }
      return false;
    });

    if (!isAllowed) {
      this.logger.warn(`Blocked webhook request from unauthorized IP: ${clientIp}`);
      throw new ForbiddenException('Access denied');
    }

    next();
  }

  private async initializeIps() {
    try {
      await this.refreshIps();
      // Set up periodic refresh
      setInterval(() => this.refreshIps(), this.IP_REFRESH_INTERVAL);
    } catch (error) {
      this.logger.error('Failed to initialize Stripe IP whitelist', error);
      // In case of error, we'll use the last known good IPs or fallback to signature verification only
    }
  }

  private async refreshIps() {
    try {
      // Fetch the latest Stripe webhook IPs
      const response = await this.stripe.webhookEndpoints.list();
      const webhookIps = new Set<string>();
      
      // Add Stripe's documented IP ranges
      // Note: In a production environment, you should fetch these from Stripe's API
      // or their public documentation and update this list regularly
      const stripeIps = [
        '3.18.12.63',
        '3.130.192.231',
        '13.235.14.237',
        '13.235.122.149',
        '18.211.135.69',
        '35.154.171.200',
        '52.15.183.38',
        '54.187.174.169',
        '54.187.205.235',
        '54.187.216.72',
        '54.241.31.99',
        '54.241.31.102',
        '54.241.34.107',
      ];

      stripeIps.forEach(ip => webhookIps.add(ip));
      
      // Add any custom IPs from environment
      const customIps = this.configService.get<string>('STRIPE_WEBHOOK_ALLOWED_IPS', '')
        .split(',')
        .map(ip => ip.trim())
        .filter(ip => ip);
      
      customIps.forEach(ip => webhookIps.add(ip));
      
      this.allowedIps.length = 0;
      this.allowedIps.push(...Array.from(webhookIps));
      this.lastIpFetchTime = Date.now();
      
      this.logger.log(`Refreshed Stripe webhook IP whitelist with ${this.allowedIps.length} IPs`);
    } catch (error) {
      this.logger.error('Failed to refresh Stripe IP whitelist', error);
      // Don't throw to prevent application startup failure
    }
  }

  private getClientIp(req: Request): string {
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

  private isIpInCidr(ip: string, cidr: string): boolean {
    try {
      const [range, bits] = cidr.split('/');
      const ipLong = this.ipToLong(ip);
      const rangeLong = this.ipToLong(range);
      const mask = ~(Math.pow(2, 32 - parseInt(bits, 10)) - 1) >>> 0;
      return (ipLong & mask) === (rangeLong & mask);
    } catch (e) {
      return false;
    }
  }

  private ipToLong(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
  }
}
