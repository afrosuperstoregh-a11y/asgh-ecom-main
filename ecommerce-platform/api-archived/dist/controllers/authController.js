"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const response_1 = require("../utils/response");
const ApiError_1 = require("../utils/ApiError");
const asyncHandler_1 = require("../utils/asyncHandler");
const security_1 = require("../utils/security");
class AuthController {
}
exports.AuthController = AuthController;
_a = AuthController;
// POST /api/auth/register - User registration
AuthController.register = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email, password, name, phone } = req.body;
    // Check if user already exists
    const existingUser = await database_1.db.user.findUnique({
        where: { email: security_1.SecurityUtils.sanitizeEmail(email) }
    });
    if (existingUser) {
        throw ApiError_1.ApiError.conflict('User with this email already exists');
    }
    // Hash password
    const hashedPassword = await security_1.SecurityUtils.hashPassword(password);
    // Generate email verification token
    const emailVerificationToken = security_1.SecurityUtils.generateEmailVerificationToken();
    // Create user
    const user = await database_1.db.user.create({
        data: {
            email: security_1.SecurityUtils.sanitizeEmail(email),
            password: hashedPassword,
            name: name ? security_1.SecurityUtils.sanitizeString(name, 100) : null,
            phone: phone ? security_1.SecurityUtils.sanitizeString(phone, 20) : null,
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
    const token = security_1.SecurityUtils.generateToken({
        userId: user.id,
        email: user.email
    });
    // Cache user session
    await redis_1.redisClient.cacheUserSession(user.id, {
        userId: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        emailVerified: user.emailVerified
    });
    return response_1.ApiResponseUtil.created(res, {
        user,
        token
    }, 'User registered successfully');
});
// POST /api/auth/login - User login
AuthController.login = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    // Find user
    const user = await database_1.db.user.findUnique({
        where: { email: security_1.SecurityUtils.sanitizeEmail(email) }
    });
    if (!user) {
        throw ApiError_1.ApiError.unauthorized('Invalid email or password');
    }
    // Verify password
    if (!user.password) {
        throw ApiError_1.ApiError.unauthorized('Invalid email or password');
    }
    const isPasswordValid = await security_1.SecurityUtils.comparePassword(password, user.password);
    if (!isPasswordValid) {
        throw ApiError_1.ApiError.unauthorized('Invalid email or password');
    }
    // Generate JWT token
    const token = security_1.SecurityUtils.generateToken({
        userId: user.id,
        email: user.email
    });
    // Cache user session
    await redis_1.redisClient.cacheUserSession(user.id, {
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
    return response_1.ApiResponseUtil.success(res, {
        user: userResponse,
        token
    }, 'Login successful');
});
// POST /api/auth/verify-email - Email verification
AuthController.verifyEmail = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { token } = req.body;
    if (!token) {
        throw ApiError_1.ApiError.badRequest('Verification token is required');
    }
    // Find user with verification token
    const user = await database_1.db.user.findFirst({
        where: { emailVerificationToken: token }
    });
    if (!user) {
        throw ApiError_1.ApiError.badRequest('Invalid or expired verification token');
    }
    // Update user as verified
    const updatedUser = await database_1.db.user.update({
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
    await redis_1.redisClient.cacheUserSession(user.id, {
        userId: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        phone: updatedUser.phone,
        emailVerified: updatedUser.emailVerified
    });
    return response_1.ApiResponseUtil.success(res, updatedUser, 'Email verified successfully');
});
// POST /api/auth/forgot-password - Forgot password
AuthController.forgotPassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email } = req.body;
    const user = await database_1.db.user.findUnique({
        where: { email: security_1.SecurityUtils.sanitizeEmail(email) }
    });
    // Always return success to prevent email enumeration
    if (!user) {
        return response_1.ApiResponseUtil.success(res, null, 'If an account with this email exists, a password reset link has been sent');
    }
    // Generate reset token
    const resetToken = security_1.SecurityUtils.generatePasswordResetToken();
    const resetExpires = security_1.SecurityUtils.getPasswordResetExpiry();
    // Update user with reset token
    await database_1.db.user.update({
        where: { id: user.id },
        data: {
            resetPasswordToken: resetToken,
            resetPasswordExpires: resetExpires
        }
    });
    // TODO: Send password reset email
    // await EmailService.sendPasswordResetEmail(user.email, resetToken);
    return response_1.ApiResponseUtil.success(res, null, 'If an account with this email exists, a password reset link has been sent');
});
// POST /api/auth/reset-password - Reset password
AuthController.resetPassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) {
        throw ApiError_1.ApiError.badRequest('Reset token and new password are required');
    }
    // Find user with valid reset token
    const user = await database_1.db.user.findFirst({
        where: {
            resetPasswordToken: token,
            resetPasswordExpires: {
                gt: new Date()
            }
        }
    });
    if (!user) {
        throw ApiError_1.ApiError.badRequest('Invalid or expired reset token');
    }
    // Hash new password
    const hashedPassword = await security_1.SecurityUtils.hashPassword(password);
    // Update user password and clear reset token
    const updatedUser = await database_1.db.user.update({
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
    await redis_1.redisClient.cacheUserSession(user.id, {
        userId: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        phone: updatedUser.phone,
        emailVerified: updatedUser.emailVerified
    });
    return response_1.ApiResponseUtil.success(res, updatedUser, 'Password reset successfully');
});
// POST /api/auth/change-password - Change password (authenticated)
AuthController.changePassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        throw ApiError_1.ApiError.badRequest('Current password and new password are required');
    }
    // Get user with password
    const user = await database_1.db.user.findUnique({
        where: { id: userId },
        select: { password: true }
    });
    if (!user || !user.password) {
        throw ApiError_1.ApiError.internal('User not found');
    }
    // Verify current password
    const isCurrentPasswordValid = await security_1.SecurityUtils.comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
        throw ApiError_1.ApiError.unauthorized('Current password is incorrect');
    }
    // Hash new password
    const hashedNewPassword = await security_1.SecurityUtils.hashPassword(newPassword);
    // Update password
    await database_1.db.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword }
    });
    return response_1.ApiResponseUtil.success(res, null, 'Password changed successfully');
});
// GET /api/auth/me - Get current user profile
AuthController.getProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    // Try to get from cache first
    const cachedUser = await redis_1.redisClient.getCachedUserSession(userId);
    if (cachedUser) {
        return response_1.ApiResponseUtil.success(res, cachedUser);
    }
    // Get from database
    const user = await database_1.db.user.findUnique({
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
        throw ApiError_1.ApiError.notFound('User not found');
    }
    // Cache user data
    await redis_1.redisClient.cacheUserSession(userId, user);
    return response_1.ApiResponseUtil.success(res, user);
});
// PUT /api/auth/me - Update user profile
AuthController.updateProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const { name, phone } = req.body;
    const updateData = {};
    if (name !== undefined) {
        updateData.name = security_1.SecurityUtils.sanitizeString(name, 100);
    }
    if (phone !== undefined) {
        updateData.phone = phone ? security_1.SecurityUtils.sanitizeString(phone, 20) : null;
    }
    const updatedUser = await database_1.db.user.update({
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
    await redis_1.redisClient.cacheUserSession(userId, updatedUser);
    return response_1.ApiResponseUtil.success(res, updatedUser, 'Profile updated successfully');
});
// POST /api/auth/logout - Logout user
AuthController.logout = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    if (userId) {
        // Remove user session from cache
        await redis_1.redisClient.del(`session:${userId}`);
    }
    return response_1.ApiResponseUtil.success(res, null, 'Logged out successfully');
});
