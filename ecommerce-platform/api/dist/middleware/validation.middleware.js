"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runValidations = exports.validate = void 0;
const express_validator_1 = require("express-validator");
const canadaPost_1 = require("../types/canadaPost");
const validate = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const errorMessages = [];
        errors.array().forEach((error) => {
            if ('param' in error) {
                errorMessages.push({
                    field: error.param,
                    message: error.msg,
                    value: 'value' in error ? error.value : undefined,
                });
            }
            else if (error.nestedErrors) {
                // Handle nested errors if needed
                error.nestedErrors.forEach(nestedError => {
                    if ('param' in nestedError) {
                        errorMessages.push({
                            field: nestedError.param,
                            message: nestedError.msg,
                            value: 'value' in nestedError ? nestedError.value : undefined,
                        });
                    }
                });
            }
        });
        if (errorMessages.length > 0) {
            throw new canadaPost_1.CanadaPostError('Validation failed', 'VALIDATION_ERROR', 400, 'https://developer.canadapost.ca/api/errors');
        }
    }
    next();
};
exports.validate = validate;
// Helper to run validations in sequence
const runValidations = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));
        (0, exports.validate)(req, res, next);
    };
};
exports.runValidations = runValidations;
