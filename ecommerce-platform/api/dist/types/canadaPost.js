"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanadaPostError = void 0;
class CanadaPostError extends Error {
    constructor(message, code, statusCode = 500, helpUrl) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.helpUrl = helpUrl;
        this.name = 'CanadaPostError';
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, CanadaPostError);
        }
    }
}
exports.CanadaPostError = CanadaPostError;
