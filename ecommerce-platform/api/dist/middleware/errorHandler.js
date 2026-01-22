"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const ApiError_1 = require("../utils/ApiError");
const errorHandler = (err, req, res, next) => {
    if (err instanceof ApiError_1.ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            ...(process.env.NODE_ENV === "development" && { stack: err.stack })
        });
    }
    console.error("Unhandled error:", err);
    return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        ...(process.env.NODE_ENV === "development" && { error: err.message, stack: err.stack })
    });
};
exports.errorHandler = errorHandler;
