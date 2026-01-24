"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleValidationErrors = exports.validate = void 0;
const express_validator_1 = require("express-validator");
const ApiError_1 = require("./ApiError");
const validate = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return next(ApiError_1.ApiError.badRequest(`Validation failed: ${errorMessages.join(', ')}`));
        }
        next();
    };
};
exports.validate = validate;
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => ({
            field: error.type === 'field' ? error.path : 'unknown',
            message: error.msg
        }));
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errorMessages
        });
    }
    next();
};
exports.handleValidationErrors = handleValidationErrors;
