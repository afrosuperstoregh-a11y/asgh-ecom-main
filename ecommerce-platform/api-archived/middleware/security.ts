import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import UAParser from 'ua-parser-js';
import geoip from 'geoip-lite';
import { z } from 'zod';

const prisma = new PrismaClient();

// Security configuration
const SECURITY_CONFIG = {
  jwtSecret: new TextEncoder().encode(process.env.JWT_SECRET),
  jwtRefreshSecret: new TextEncoder().encode(process.env.JWT_REFRESH_SECRET),
  encryptionKey: process.env.ENCRYPTION_KEY!,
  sessionSecret: process.env.SESSION_SECRET!,
  mfaSecretKey: process.env.MFA_SECRET_KEY!,
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '12'),
  accountLockoutThreshold: parseInt(process.env.ACCOUNT_LOCKOUT_THRESHOLD || '5'),
  accountLockoutDuration: parseInt(process.env.ACCOUNT_LOCKOUT_DURATION || '900'),
  sessionTimeoutMinutes: parseInt(process.env.SESSION_TIMEOUT_MINUTES || '30'),
};

// Encryption utilities
export class SecurityUtils {
  static encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm', SECURITY_CONFIG.encryptionKey);
    cipher.setAAD(Buffer.from('ecommerce-platform'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  static decrypt(encrypted: string, iv: string, tag: string): string {
    const decipher = crypto.createDecipher('aes-256-gcm', SECURITY_CONFIG.encryptionKey);
    decipher.setAAD(Buffer.from('ecommerce-platform'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  static hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  static generateDeviceFingerprint(userAgent: string, ip: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(`${userAgent}:${ip}:${SECURITY_CONFIG.sessionSecret}`);
    return hash.digest('hex');
  }
}

// JWT utilities
export class JWTUtils {
  static async generateAccessToken(payload: any): Promise<string> {
    return await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m')
      .setIssuer('ecommerce-platform')
      .setAudience('ecommerce-users')
      .sign(SECURITY_CONFIG.jwtSecret);
  }

  static async generateRefreshToken(payload: any): Promise<string> {
    return await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .setIssuer('ecommerce-platform')
      .setAudience('ecommerce-users')
      .sign(SECURITY_CONFIG.jwtRefreshSecret);
  }

  static async verifyAccessToken(token: string): Promise<any> {
    const { payload } = await jwtVerify(token, SECURITY_CONFIG.jwtSecret);
    return payload;
  }

  static async verifyRefreshToken(token: string): Promise<any> {
    const { payload } = await jwtVerify(token, SECURITY_CONFIG.jwtRefreshSecret);
    return payload;
  }
}

// Rate limiting middleware
export const rateLimiter = rateLimit({
  windowMs: SECURITY_CONFIG.rateLimitWindowMs,
  max: SECURITY_CONFIG.rateLimitMaxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(SECURITY_CONFIG.rateLimitWindowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || 'unknown';
  }
});

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: true,
  frameguard: { action: 'sameorigin' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true,
});

// Input validation schemas
export const securitySchemas = {
  login: z.object({
    email: z.string().email(),
    password: z.string().min(SECURITY_CONFIG.passwordMinLength),
    mfaCode: z.string().length(6).optional(),
    deviceFingerprint: z.string().optional(),
  }),
  
  register: z.object({
    email: z.string().email(),
    password: z.string()
      .min(SECURITY_CONFIG.passwordMinLength)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
             'Password must contain uppercase, lowercase, number, and special character'),
    name: z.string().min(2),
    phone: z.string().optional(),
    acceptTerms: z.boolean().true(),
    consentMarketing: z.boolean().default(false),
  }),
  
  passwordChange: z.object({
    currentPassword: z.string(),
    newPassword: z.string()
      .min(SECURITY_CONFIG.passwordMinLength)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
    confirmPassword: z.string(),
  }),
  
  mfaSetup: z.object({
    secret: z.string(),
    token: z.string().length(6),
  }),
};

// Authentication middleware
export async function authenticateToken(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return { error: 'Access token required', status: 401 };
    }

    const payload = await JWTUtils.verifyAccessToken(token);
    
    // Check if session is still active
    const session = await prisma.securitySession.findFirst({
      where: {
        userId: payload.userId,
        token: token,
        isActive: true,
        expiresAt: { gt: new Date() }
      }
    });

    if (!session) {
      return { error: 'Invalid or expired session', status: 401 };
    }

    // Update session activity
    await prisma.securitySession.update({
      where: { id: session.id },
      data: { lastActivityAt: new Date() }
    });

    return { user: payload, session };
  } catch (error) {
    return { error: 'Invalid token', status: 401 };
  }
}

// Role-based access control
export function requireRole(allowedRoles: string[]) {
  return async (req: NextRequest) => {
    const auth = await authenticateToken(req);
    
    if (auth.error) {
      return auth;
    }

    if (!allowedRoles.includes(auth.user.role)) {
      return { error: 'Insufficient permissions', status: 403 };
    }

    return auth;
  };
}

// Multi-Factor Authentication
export class MFAService {
  static generateSecret(userEmail: string): { secret: string; qrCode: string } {
    const secret = speakeasy.generateSecret({
      name: `E-Commerce Platform (${userEmail})`,
      issuer: 'E-Commerce Platform',
      length: 32
    });

    return {
      secret: secret.base32!,
      qrCode: qrcode.toDataURL(secret.otpauth_url!)
    };
  }

  static verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2
    });
  }

  static generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }
}

// Security event logging
export class SecurityLogger {
  static async logEvent(data: {
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    userId?: string;
    adminUserId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    resourceType?: string;
    resourceId?: string;
    details?: any;
  }) {
    try {
      await prisma.securityEvent.create({
        data: {
          ...data,
          createdAt: new Date(),
        }
      });

      // Log to external monitoring system
      if (data.severity === 'HIGH' || data.severity === 'CRITICAL') {
        await this.sendAlert(data);
      }
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  private static async sendAlert(event: any) {
    // Integration with alerting systems (Slack, PagerDuty, etc.)
    console.log('SECURITY ALERT:', event);
  }
}

// Device fingerprinting and anomaly detection
export class DeviceSecurity {
  static analyzeRequest(req: NextRequest) {
    const userAgent = req.headers.get('user-agent') || '';
    const ip = req.ip || 'unknown';
    const parser = new UAParser(userAgent);
    const geo = geoip.lookup(ip);

    return {
      userAgent,
      ip,
      device: parser.getDevice(),
      browser: parser.getBrowser(),
      os: parser.getOS(),
      location: geo,
      fingerprint: SecurityUtils.generateDeviceFingerprint(userAgent, ip),
    };
  }

  static async detectAnomalies(userId: string, currentRequest: any) {
    const recentSessions = await prisma.securitySession.findMany({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const anomalies: string[] = [];

    // Check for new device
    const deviceExists = recentSessions.some(session => 
      session.deviceFingerprint === currentRequest.fingerprint
    );
    if (!deviceExists) {
      anomalies.push('NEW_DEVICE');
    }

    // Check for new location
    const locationExists = recentSessions.some(session => {
      const sessionLocation = JSON.parse(session.location || '{}');
      return sessionLocation.country === currentRequest.location?.country;
    });
    if (!locationExists && currentRequest.location) {
      anomalies.push('NEW_LOCATION');
    }

    // Check for rapid login attempts
    const recentLogins = recentSessions.filter(session =>
      session.createdAt > new Date(Date.now() - 60 * 60 * 1000)
    );
    if (recentLogins.length > 3) {
      anomalies.push('RAPID_LOGINS');
    }

    return anomalies;
  }
}

// Account lockout service
export class AccountSecurity {
  static async handleFailedLogin(email: string, ipAddress: string) {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) return;

    // Log failed attempt
    await SecurityLogger.logEvent({
      type: 'LOGIN_FAILURE',
      severity: 'MEDIUM',
      description: `Failed login attempt for ${email}`,
      userId: user.id,
      ipAddress,
    });

    // Check lockout threshold
    const recentFailures = await prisma.securityEvent.count({
      where: {
        userId: user.id,
        type: 'LOGIN_FAILURE',
        createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) }
      }
    });

    if (recentFailures >= SECURITY_CONFIG.accountLockoutThreshold) {
      await this.lockAccount(user.id);
    }
  }

  static async lockAccount(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { 
        // Add lockout fields to user model if needed
        // isLocked: true,
        // lockedUntil: new Date(Date.now() + SECURITY_CONFIG.accountLockoutDuration * 1000)
      }
    });

    await SecurityLogger.logEvent({
      type: 'ACCOUNT_LOCKED',
      severity: 'HIGH',
      description: 'Account locked due to multiple failed login attempts',
      userId,
    });
  }

  static async unlockAccount(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        // isLocked: false,
        // lockedUntil: null
      }
    });

    await SecurityLogger.logEvent({
      type: 'ACCOUNT_UNLOCKED',
      severity: 'MEDIUM',
      description: 'Account manually unlocked',
      userId,
    });
  }
}

// Password policy validation
export class PasswordPolicy {
  static validate(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < SECURITY_CONFIG.passwordMinLength) {
      errors.push(`Password must be at least ${SECURITY_CONFIG.passwordMinLength} characters long`);
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[@$!%*?&]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common patterns
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /admin/i,
      /letmein/i
    ];

    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        errors.push('Password contains common patterns that are not allowed');
        break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Session management
export class SessionManager {
  static async createSession(userId: string, token: string, request: any) {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    const session = await prisma.securitySession.create({
      data: {
        userId,
        sessionId: SecurityUtils.generateSecureToken(),
        token,
        deviceFingerprint: request.fingerprint,
        ipAddress: request.ip,
        userAgent: request.userAgent,
        location: JSON.stringify(request.location),
        expiresAt,
      }
    });

    await SecurityLogger.logEvent({
      type: 'LOGIN_SUCCESS',
      severity: 'LOW',
      description: 'User successfully logged in',
      userId,
      sessionId: session.id,
      ipAddress: request.ip,
      userAgent: request.userAgent,
    });

    return session;
  }

  static async invalidateSession(sessionId: string) {
    await prisma.securitySession.update({
      where: { id: sessionId },
      data: { isActive: false }
    });

    await SecurityLogger.logEvent({
      type: 'LOGOUT',
      severity: 'LOW',
      description: 'User logged out',
      sessionId,
    });
  }

  static async invalidateAllUserSessions(userId: string) {
    await prisma.securitySession.updateMany({
      where: { userId },
      data: { isActive: false }
    });

    await SecurityLogger.logEvent({
      type: 'SESSION_INVALIDATED',
      severity: 'MEDIUM',
      description: 'All user sessions invalidated',
      userId,
    });
  }
}

// Export main security middleware
export function securityMiddleware(handler: Function) {
  return async (req: NextRequest, ...args: any[]) => {
    try {
      // Apply security headers
      const response = await handler(req, ...args);
      
      // Add security headers
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

      return response;
    } catch (error) {
      console.error('Security middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}
