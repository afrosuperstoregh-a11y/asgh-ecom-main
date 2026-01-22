"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authenticate = void 0;
const security_1 = require("../utils/security");
const ApiError_1 = require("../utils/ApiError");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            throw ApiError_1.ApiError.unauthorized('Authorization header is required');
        }
        const token = security_1.SecurityUtils.extractTokenFromHeader(authHeader);
        const decoded = security_1.SecurityUtils.verifyToken(token);
        req.user = {
            userId: decoded.userId,
            email: decoded.email
        };
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.authenticate = authenticate;
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = security_1.SecurityUtils.extractTokenFromHeader(authHeader);
            const decoded = security_1.SecurityUtils.verifyToken(token);
            req.user = {
                userId: decoded.userId,
                email: decoded.email
            };
        }
        next();
    }
    catch (error) {
        // For optional auth, we don't throw errors, just continue without user
        next();
    }
};
exports.optionalAuth = optionalAuth;
