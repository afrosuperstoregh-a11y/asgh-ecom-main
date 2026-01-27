const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class AuthService {
  constructor() {
    this.saltRounds = 12;
    this.jwtSecret = process.env.JWT_SECRET;
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET;
    this.refreshTokenExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

    if (!this.jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
  }

  // Hash password using bcrypt
  async hashPassword(password) {
    try {
      return await bcrypt.hash(password, this.saltRounds);
    } catch (error) {
      throw new Error('Password hashing failed');
    }
  }

  // Verify password using bcrypt
  async verifyPassword(password, hashedPassword) {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      throw new Error('Password verification failed');
    }
  }

  // Generate JWT tokens
  generateTokens(user) {
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified
    };

    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
      issuer: 'asca-ecommerce',
      audience: 'admin-panel'
    });

    const refreshToken = jwt.sign(
      { id: user.id, type: 'refresh' },
      this.refreshTokenSecret,
      {
        expiresIn: this.refreshTokenExpiresIn,
        issuer: 'asca-ecommerce'
      }
    );

    return { accessToken, refreshToken };
  }

  // Verify JWT token
  verifyToken(token, isRefreshToken = false) {
    try {
      const secret = isRefreshToken ? this.refreshTokenSecret : this.jwtSecret;
      const decoded = jwt.verify(token, secret);

      if (isRefreshToken && decoded.type !== 'refresh') {
        throw new Error('Invalid refresh token');
      }

      return { valid: true, payload: decoded };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return { valid: false, error: 'Token expired' };
      } else if (error.name === 'JsonWebTokenError') {
        return { valid: false, error: 'Invalid token' };
      } else {
        return { valid: false, error: 'Token validation failed' };
      }
    }
  }

  // Authenticate user with email and password
  async authenticate(email, password, ipAddress) {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: {
          id: true,
          email: true,
          name: true,
          password: true,
          role: true,
          emailVerified: true,
          createdAt: true
        }
      });

      if (!user) {
        return { success: false, message: 'Invalid credentials' };
      }

      // Check if user has admin role
      if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        return { success: false, message: 'Invalid credentials' };
      }

      // Check if password exists and verify it
      if (!user.password) {
        return { success: false, message: 'Invalid credentials' };
      }

      const isPasswordValid = await this.verifyPassword(password, user.password);
      if (!isPasswordValid) {
        return { success: false, message: 'Invalid credentials' };
      }

      // Generate tokens
      const { accessToken, refreshToken } = this.generateTokens(user);

      // Remove password from user object
      const { password: _, ...userWithoutPassword } = user;

      // Log successful login
      await this.logAuthEvent({
        userId: user.id,
        email: user.email,
        action: 'LOGIN_SUCCESS',
        ipAddress,
        userAgent: 'admin-panel',
        success: true
      });

      return {
        success: true,
        message: 'Login successful',
        user: userWithoutPassword,
        tokens: { accessToken, refreshToken }
      };
    } catch (error) {
      console.error('Authentication error:', error);
      
      // Log failed login attempt
      await this.logAuthEvent({
        email,
        action: 'LOGIN_FAILED',
        ipAddress,
        userAgent: 'admin-panel',
        success: false,
        error: error.message
      });

      return { success: false, message: 'Authentication failed' };
    }
  }

  // Refresh access token
  async refreshToken(refreshTokenString, ipAddress) {
    try {
      const verification = this.verifyToken(refreshTokenString, true);
      
      if (!verification.valid) {
        return { success: false, message: 'Invalid refresh token' };
      }

      const user = await prisma.user.findUnique({
        where: { id: verification.payload.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true
        }
      });

      if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        return { success: false, message: 'User not found or invalid role' };
      }

      const { accessToken, refreshToken } = this.generateTokens(user);

      await this.logAuthEvent({
        userId: user.id,
        email: user.email,
        action: 'TOKEN_REFRESH',
        ipAddress,
        userAgent: 'admin-panel',
        success: true
      });

      return {
        success: true,
        tokens: { accessToken, refreshToken }
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      return { success: false, message: 'Token refresh failed' };
    }
  }

  // Create admin user (for initial setup)
  async createAdminUser(userData) {
    try {
      const { email, password, name, role = 'ADMIN' } = userData;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (existingUser) {
        return { success: false, message: 'User already exists' };
      }

      // Hash password
      const hashedPassword = await this.hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name,
          password: hashedPassword,
          role,
          emailVerified: new Date()
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
          createdAt: true
        }
      });

      await this.logAuthEvent({
        userId: user.id,
        email: user.email,
        action: 'ADMIN_CREATED',
        ipAddress: 'system',
        userAgent: 'system',
        success: true
      });

      return {
        success: true,
        message: 'Admin user created successfully',
        user
      };
    } catch (error) {
      console.error('Create admin user error:', error);
      return { success: false, message: 'Failed to create admin user' };
    }
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword, ipAddress) {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: { password: true, email: true, role: true }
      });

      if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        return { success: false, message: 'User not found' };
      }

      // Verify current password
      const isCurrentPasswordValid = await this.verifyPassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return { success: false, message: 'Current password is incorrect' };
      }

      // Hash new password
      const hashedNewPassword = await this.hashPassword(newPassword);

      // Update password
      await prisma.user.update({
        where: { id },
        data: { password: hashedNewPassword }
      });

      await this.logAuthEvent({
        userId,
        email: user.email,
        action: 'PASSWORD_CHANGED',
        ipAddress,
        userAgent: 'admin-panel',
        success: true
      });

      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, message: 'Failed to change password' };
    }
  }

  // Log authentication events
  async logAuthEvent(eventData) {
    try {
      await prisma.adminAuditLog.create({
        data: {
          userId: eventData.userId || null,
          email: eventData.email || null,
          action: eventData.action,
          ipAddress: eventData.ipAddress,
          userAgent: eventData.userAgent,
          success: eventData.success || false,
          error: eventData.error || null,
          metadata: eventData.metadata || {},
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to log auth event:', error);
      // Don't throw error - logging failures shouldn't break auth flow
    }
  }

  // Validate admin session
  async validateSession(token) {
    try {
      const verification = this.verifyToken(token);
      
      if (!verification.valid) {
        return { valid: false, error: verification.error };
      }

      const user = await prisma.user.findUnique({
        where: { id: verification.payload.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true
        }
      });

      if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        return { valid: false, error: 'User not found or invalid role' };
      }

      return { valid: true, user };
    } catch (error) {
      console.error('Session validation error:', error);
      return { valid: false, error: 'Session validation failed' };
    }
  }
}

module.exports = AuthService;
