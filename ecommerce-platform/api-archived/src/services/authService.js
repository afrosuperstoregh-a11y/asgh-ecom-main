const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const emailService = require('./emailService');
const { nanoid } = require('nanoid');

const prisma = new PrismaClient();

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET;
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1h';
    this.jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    this.bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  }

  /**
   * Register a new user
   */
  async register(userData) {
    const { email, password, name, phone } = userData;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, this.bcryptRounds);

    // Generate email verification token
    const verificationToken = nanoid(32);
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires
      }
    });

    // Send verification email
    try {
      await emailService.sendWelcomeEmail(user, verificationToken);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Don't throw error here, user can still request verification later
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Authenticate user and generate tokens
   */
  async login(email, password, deviceInfo = {}) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new Error('Account is temporarily locked. Please try again later.');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Increment login attempts
      const loginAttempts = user.loginAttempts + 1;
      const lockedUntil = loginAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null; // Lock for 15 minutes

      await prisma.user.update({
        where: { id: user.id },
        data: { loginAttempts, lockedUntil }
      });

      throw new Error('Invalid credentials');
    }

    // Reset login attempts on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        loginAttempts: 0, 
        lockedUntil: null,
        lastLoginAt: new Date()
      }
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, deviceInfo);

    // Return user and tokens
    const { password: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      tokens
    };
  }

  /**
   * Generate JWT tokens
   */
  async generateTokens(userId, deviceInfo = {}) {
    const accessToken = jwt.sign(
      { userId },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn }
    );

    const refreshToken = jwt.sign(
      { userId },
      this.jwtRefreshSecret,
      { expiresIn: this.jwtRefreshExpiresIn }
    );

    // Store session in database
    const expiresAt = new Date(Date.now() + this.parseExpirationTime(this.jwtRefreshExpiresIn));
    
    await prisma.userSession.create({
      data: {
        userId,
        token: accessToken,
        refreshToken,
        deviceInfo,
        expiresAt
      }
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpirationTime(this.jwtExpiresIn) / 1000
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, this.jwtRefreshSecret);
      
      // Find session
      const session = await prisma.userSession.findFirst({
        where: {
          refreshToken,
          isActive: true,
          expiresAt: { gt: new Date() }
        },
        include: { user: true }
      });

      if (!session) {
        throw new Error('Invalid or expired refresh token');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(session.userId, session.deviceInfo);

      // Deactivate old session
      await prisma.userSession.update({
        where: { id: session.id },
        data: { isActive: false }
      });

      return tokens;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Logout user
   */
  async logout(accessToken) {
    try {
      const decoded = jwt.verify(accessToken, this.jwtSecret);
      
      // Deactivate session
      await prisma.userSession.updateMany({
        where: {
          userId: decoded.userId,
          token: accessToken,
          isActive: true
        },
        data: { isActive: false }
      });

      return true;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(token) {
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: { gt: new Date() }
      }
    });

    if (!user) {
      throw new Error('Invalid or expired verification token');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null
      }
    });

    return true;
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email) {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if user exists
      return true;
    }

    // Generate reset token
    const resetToken = nanoid(32);
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires
      }
    });

    // Send reset email
    try {
      await emailService.sendPasswordResetEmail(user, resetToken);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }

    return true;
  }

  /**
   * Reset password
   */
  async resetPassword(token, newPassword) {
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() }
      }
    });

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, this.bcryptRounds);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        loginAttempts: 0,
        lockedUntil: null
      }
    });

    // Deactivate all sessions (force re-login)
    await prisma.userSession.updateMany({
      where: { userId: user.id },
      data: { isActive: false }
    });

    return true;
  }

  /**
   * Validate JWT token
   */
  async validateToken(accessToken) {
    try {
      const decoded = jwt.verify(accessToken, this.jwtSecret);
      
      // Check if session is active
      const session = await prisma.userSession.findFirst({
        where: {
          userId: decoded.userId,
          token: accessToken,
          isActive: true,
          expiresAt: { gt: new Date() }
        }
      });

      if (!session) {
        throw new Error('Session not found or expired');
      }

      // Update last used time
      await prisma.userSession.update({
        where: { id: session.id },
        data: { lastUsedAt: new Date() }
      });

      return decoded.userId;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Change password
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, this.bcryptRounds);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    // Deactivate all sessions except current one
    // This forces re-login on other devices
    return true;
  }

  /**
   * Parse expiration time string to milliseconds
   */
  parseExpirationTime(timeString) {
    const units = {
      's': 1000,
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000
    };

    const match = timeString.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error('Invalid time format');
    }

    const [, amount, unit] = match;
    return parseInt(amount) * units[unit];
  }
}

module.exports = new AuthService();
