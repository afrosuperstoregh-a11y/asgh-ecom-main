import { Request, Response } from 'express';
import { db } from '../config/database';
import { redisClient } from '../config/redis';
import { ApiResponseUtil } from '../utils/response';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { SecurityUtils } from '../utils/security';

export class AuthController {
  // POST /api/auth/register - User registration
  static register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, name, phone } = req.body;

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: SecurityUtils.sanitizeEmail(email) }
    });

    if (existingUser) {
      throw ApiError.conflict('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await SecurityUtils.hashPassword(password);

    // Generate email verification token
    const emailVerificationToken = SecurityUtils.generateEmailVerificationToken();

    // Create user
    const user = await db.user.create({
      data: {
        email: SecurityUtils.sanitizeEmail(email),
        password: hashedPassword,
        name: name ? SecurityUtils.sanitizeString(name, 100) : null,
        phone: phone ? SecurityUtils.sanitizeString(phone, 20) : null,
        emailVerificationToken
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        emailVerified: true,
        createdAt: true
      }
    });

    // TODO: Send verification email
    // await EmailService.sendVerificationEmail(user.email, emailVerificationToken);

    // Generate JWT token
    const token = SecurityUtils.generateToken({
      userId: user.id,
      email: user.email
    });

    // Cache user session
    await redisClient.cacheUserSession(user.id, {
      userId: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      emailVerified: user.emailVerified
    });

    return ApiResponseUtil.created(res, {
      user,
      token
    }, 'User registered successfully');
  });

  // POST /api/auth/login - User login
  static login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Find user
    const user = await db.user.findUnique({
      where: { email: SecurityUtils.sanitizeEmail(email) }
    });

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Verify password
    if (!user.password) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isPasswordValid = await SecurityUtils.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Generate JWT token
    const token = SecurityUtils.generateToken({
      userId: user.id,
      email: user.email
    });

    // Cache user session
    await redisClient.cacheUserSession(user.id, {
      userId: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      emailVerified: user.emailVerified
    });

    // Return user data without password
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt
    };

    return ApiResponseUtil.success(res, {
      user: userResponse,
      token
    }, 'Login successful');
  });

  // POST /api/auth/verify-email - Email verification
  static verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;

    if (!token) {
      throw ApiError.badRequest('Verification token is required');
    }

    // Find user with verification token
    const user = await db.user.findFirst({
      where: { emailVerificationToken: token }
    });

    if (!user) {
      throw ApiError.badRequest('Invalid or expired verification token');
    }

    // Update user as verified
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        emailVerified: true,
        createdAt: true
      }
    });

    // Update cached session
    await redisClient.cacheUserSession(user.id, {
      userId: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      phone: updatedUser.phone,
      emailVerified: updatedUser.emailVerified
    });

    return ApiResponseUtil.success(res, updatedUser, 'Email verified successfully');
  });

  // POST /api/auth/forgot-password - Forgot password
  static forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    const user = await db.user.findUnique({
      where: { email: SecurityUtils.sanitizeEmail(email) }
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return ApiResponseUtil.success(res, null, 'If an account with this email exists, a password reset link has been sent');
    }

    // Generate reset token
    const resetToken = SecurityUtils.generatePasswordResetToken();
    const resetExpires = SecurityUtils.getPasswordResetExpiry();

    // Update user with reset token
    await db.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires
      }
    });

    // TODO: Send password reset email
    // await EmailService.sendPasswordResetEmail(user.email, resetToken);

    return ApiResponseUtil.success(res, null, 'If an account with this email exists, a password reset link has been sent');
  });

  // POST /api/auth/reset-password - Reset password
  static resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, password } = req.body;

    if (!token || !password) {
      throw ApiError.badRequest('Reset token and new password are required');
    }

    // Find user with valid reset token
    const user = await db.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      throw ApiError.badRequest('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await SecurityUtils.hashPassword(password);

    // Update user password and clear reset token
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        emailVerified: true,
        createdAt: true
      }
    });

    // Invalidate all user sessions by updating cache with new session ID
    await redisClient.cacheUserSession(user.id, {
      userId: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      phone: updatedUser.phone,
      emailVerified: updatedUser.emailVerified
    });

    return ApiResponseUtil.success(res, updatedUser, 'Password reset successfully');
  });

  // POST /api/auth/change-password - Change password (authenticated)
  static changePassword = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw ApiError.badRequest('Current password and new password are required');
    }

    // Get user with password
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { password: true }
    });

    if (!user || !user.password) {
      throw ApiError.internal('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await SecurityUtils.comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw ApiError.unauthorized('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await SecurityUtils.hashPassword(newPassword);

    // Update password
    await db.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    return ApiResponseUtil.success(res, null, 'Password changed successfully');
  });

  // GET /api/auth/me - Get current user profile
  static getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;

    // Try to get from cache first
    const cachedUser = await redisClient.getCachedUserSession(userId);
    if (cachedUser) {
      return ApiResponseUtil.success(res, cachedUser);
    }

    // Get from database
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Cache user data
    await redisClient.cacheUserSession(userId, user);

    return ApiResponseUtil.success(res, user);
  });

  // PUT /api/auth/me - Update user profile
  static updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { name, phone } = req.body;

    const updateData: any = {};
    
    if (name !== undefined) {
      updateData.name = SecurityUtils.sanitizeString(name, 100);
    }
    
    if (phone !== undefined) {
      updateData.phone = phone ? SecurityUtils.sanitizeString(phone, 20) : null;
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Update cached session
    await redisClient.cacheUserSession(userId, updatedUser);

    return ApiResponseUtil.success(res, updatedUser, 'Profile updated successfully');
  });

  // POST /api/auth/logout - Logout user
  static logout = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;

    if (userId) {
      // Remove user session from cache
      await redisClient.del(`session:${userId}`);
    }

    return ApiResponseUtil.success(res, null, 'Logged out successfully');
  });
}
