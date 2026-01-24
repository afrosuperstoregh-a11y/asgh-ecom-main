import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { ApiError } from './ApiError';

export class SecurityUtils {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
  private static readonly BCRYPT_ROUNDS = 12;

  // Password hashing
  static async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, this.BCRYPT_ROUNDS);
    } catch (error) {
      throw ApiError.internal('Failed to hash password');
    }
  }

  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      throw ApiError.internal('Failed to compare password');
    }
  }

  // JWT token handling
  static generateToken(payload: { userId: string; email: string }): string {
    try {
      return jwt.sign(payload, this.JWT_SECRET, {
        expiresIn: '7d',
        issuer: 'ecommerce-api',
        audience: 'ecommerce-client'
      });
    } catch (error) {
      throw ApiError.internal('Failed to generate token');
    }
  }

  static verifyToken(token: string): { userId: string; email: string } {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      return {
        userId: decoded.userId,
        email: decoded.email
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw ApiError.unauthorized('Token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw ApiError.unauthorized('Invalid token');
      }
      throw ApiError.internal('Failed to verify token');
    }
  }

  static generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  // Token extraction utilities
  static extractTokenFromHeader(authHeader: string | undefined): string {
    if (!authHeader) {
      throw ApiError.unauthorized('Authorization header is required');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw ApiError.unauthorized('Invalid authorization header format');
    }

    return parts[1];
  }

  // Email verification tokens
  static generateEmailVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static generatePasswordResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static getPasswordResetExpiry(): Date {
    return new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  }

  // Session utilities
  static generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Sanitization utilities
  static sanitizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  static sanitizeString(input: string, maxLength: number = 1000): string {
    return input.trim().substring(0, maxLength);
  }

  // Rate limiting utilities
  static generateRateLimitKey(identifier: string, action: string): string {
    return `rate_limit:${action}:${identifier}`;
  }

  // CSRF protection utilities
  static generateCSRFToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static validateCSRFToken(token: string, sessionToken: string): boolean {
    return token === sessionToken;
  }

  // Input validation helpers
  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }

  // Encryption utilities (for sensitive data)
  static encrypt(text: string, key: string): string {
    try {
      const algorithm = 'aes-256-cbc';
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(algorithm, key);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      throw ApiError.internal('Failed to encrypt data');
    }
  }

  static decrypt(encryptedData: string, key: string): string {
    try {
      const algorithm = 'aes-256-cbc';
      const parts = encryptedData.split(':');
      
      if (parts.length !== 2) {
        throw new Error('Invalid encrypted data format');
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      
      const decipher = crypto.createDecipher(algorithm, key);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw ApiError.internal('Failed to decrypt data');
    }
  }
}
