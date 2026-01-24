"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
class ApiError extends Error {
    constructor(statusCode, message, isOperational = true, stack = '') {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        if (stack) {
            this.stack = stack;
        }
        else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
    static badRequest(message) {
        return new ApiError(400, message);
    }
    static unauthorized(message = 'Unauthorized') {
        return new ApiError(401, message);
    }
    static forbidden(message = 'Forbidden') {
        return new ApiError(403, message);
    }
    static notFound(message = 'Resource not found') {
        return new ApiError(404, message);
    }
    static conflict(message) {
        return new ApiError(409, message);
    }
    static unprocessableEntity(message) {
        return new ApiError(422, message);
    }
    static tooManyRequests(message = 'Too many requests') {
        return new ApiError(429, message);
    }
    static internal(message = 'Internal server error') {
        return new ApiError(500, message);
    }
    static serviceUnavailable(message = 'Service unavailable') {
        return new ApiError(503, message);
    }
}
exports.ApiError = ApiError;
