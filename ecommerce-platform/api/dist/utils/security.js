"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityUtils = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const ApiError_1 = require("./ApiError");
class SecurityUtils {
    // Password hashing
    static async hashPassword(password) {
        try {
            return await bcryptjs_1.default.hash(password, this.BCRYPT_ROUNDS);
        }
        catch (error) {
            throw ApiError_1.ApiError.internal('Failed to hash password');
        }
    }
    static async comparePassword(password, hashedPassword) {
        try {
            return await bcryptjs_1.default.compare(password, hashedPassword);
        }
        catch (error) {
            throw ApiError_1.ApiError.internal('Failed to compare password');
        }
    }
    // JWT token handling
    static generateToken(payload) {
        try {
            return jsonwebtoken_1.default.sign(payload, this.JWT_SECRET, {
                expiresIn: '7d',
                issuer: 'ecommerce-api',
                audience: 'ecommerce-client'
            });
        }
        catch (error) {
            throw ApiError_1.ApiError.internal('Failed to generate token');
        }
    }
    static verifyToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.JWT_SECRET);
            return {
                userId: decoded.userId,
                email: decoded.email
            };
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw ApiError_1.ApiError.unauthorized('Token expired');
            }
            else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw ApiError_1.ApiError.unauthorized('Invalid token');
            }
            throw ApiError_1.ApiError.internal('Failed to verify token');
        }
    }
    static generateRefreshToken() {
        return crypto_1.default.randomBytes(64).toString('hex');
    }
    // Token extraction utilities
    static extractTokenFromHeader(authHeader) {
        if (!authHeader) {
            throw ApiError_1.ApiError.unauthorized('Authorization header is required');
        }
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            throw ApiError_1.ApiError.unauthorized('Invalid authorization header format');
        }
        return parts[1];
    }
    // Email verification tokens
    static generateEmailVerificationToken() {
        return crypto_1.default.randomBytes(32).toString('hex');
    }
    static generatePasswordResetToken() {
        return crypto_1.default.randomBytes(32).toString('hex');
    }
    static getPasswordResetExpiry() {
        return new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    }
    // Session utilities
    static generateSessionId() {
        return crypto_1.default.randomBytes(32).toString('hex');
    }
    // Sanitization utilities
    static sanitizeEmail(email) {
        return email.toLowerCase().trim();
    }
    static sanitizeString(input, maxLength = 1000) {
        return input.trim().substring(0, maxLength);
    }
    // Rate limiting utilities
    static generateRateLimitKey(identifier, action) {
        return `rate_limit:${action}:${identifier}`;
    }
    // CSRF protection utilities
    static generateCSRFToken() {
        return crypto_1.default.randomBytes(32).toString('hex');
    }
    static validateCSRFToken(token, sessionToken) {
        return token === sessionToken;
    }
    // Input validation helpers
    static isValidUUID(uuid) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    static isValidPhone(phone) {
        const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
        return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
    }
    // Encryption utilities (for sensitive data)
    static encrypt(text, key) {
        try {
            const algorithm = 'aes-256-cbc';
            const iv = crypto_1.default.randomBytes(16);
            const cipher = crypto_1.default.createCipher(algorithm, key);
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            return iv.toString('hex') + ':' + encrypted;
        }
        catch (error) {
            throw ApiError_1.ApiError.internal('Failed to encrypt data');
        }
    }
    static decrypt(encryptedData, key) {
        try {
            const algorithm = 'aes-256-cbc';
            const parts = encryptedData.split(':');
            if (parts.length !== 2) {
                throw new Error('Invalid encrypted data format');
            }
            const iv = Buffer.from(parts[0], 'hex');
            const encrypted = parts[1];
            const decipher = crypto_1.default.createDecipher(algorithm, key);
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (error) {
            throw ApiError_1.ApiError.internal('Failed to decrypt data');
        }
    }
}
exports.SecurityUtils = SecurityUtils;
SecurityUtils.JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
SecurityUtils.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
SecurityUtils.BCRYPT_ROUNDS = 12;
