"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runValidations = exports.validate = exports.validateTrackingNumber = exports.validateCreateShipment = exports.validateGetRates = void 0;
const express_validator_1 = require("express-validator");
const canadaPost_1 = require("../types/canadaPost");
const validateGetRates = () => [
    (0, express_validator_1.body)('originPostalCode')
        .trim()
        .isPostalCode('CA')
        .withMessage('Invalid Canadian postal code')
        .bail()
        .customSanitizer(value => value.replace(/\s+/g, '').toUpperCase()),
    (0, express_validator_1.body)('destination.postalCode')
        .trim()
        .isPostalCode('CA')
        .withMessage('Invalid Canadian postal code')
        .bail()
        .customSanitizer(value => value.replace(/\s+/g, '').toUpperCase()),
    (0, express_validator_1.body)('destination.name')
        .trim()
        .notEmpty()
        .withMessage('Recipient name is required')
        .isLength({ max: 44 })
        .withMessage('Name must be less than 45 characters'),
    (0, express_validator_1.body)('destination.address1')
        .trim()
        .notEmpty()
        .withMessage('Address line 1 is required')
        .isLength({ max: 44 })
        .withMessage('Address line 1 must be less than 45 characters'),
    (0, express_validator_1.body)('destination.city')
        .trim()
        .notEmpty()
        .withMessage('City is required')
        .isLength({ max: 40 })
        .withMessage('City must be less than 41 characters'),
    (0, express_validator_1.body)('destination.province')
        .trim()
        .notEmpty()
        .withMessage('Province is required')
        .isLength({ min: 2, max: 2 })
        .withMessage('Province must be a 2-letter code'),
    (0, express_validator_1.body)('parcel.weight')
        .isFloat({ min: 0.1, max: 30 })
        .withMessage('Weight must be between 0.1kg and 30kg'),
    (0, express_validator_1.body)('parcel.length')
        .isFloat({ min: 10, max: 200 })
        .withMessage('Length must be between 10cm and 200cm'),
    (0, express_validator_1.body)('parcel.width')
        .isFloat({ min: 1.7, max: 200 })
        .withMessage('Width must be between 1.7cm and 200cm'),
    (0, express_validator_1.body)('parcel.height')
        .isFloat({ min: 1.7, max: 200 })
        .withMessage('Height must be between 1.7cm and 200cm'),
    (0, express_validator_1.body)('options.insuranceValue')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Insurance value must be a positive number'),
    (0, express_validator_1.body)('options.signatureRequired')
        .optional()
        .isBoolean()
        .withMessage('Signature required must be a boolean')
];
exports.validateGetRates = validateGetRates;
const validateCreateShipment = () => [
    ...(0, exports.validateGetRates)(),
    (0, express_validator_1.body)('sender.name')
        .trim()
        .notEmpty()
        .withMessage('Sender name is required')
        .isLength({ max: 44 })
        .withMessage('Sender name must be less than 45 characters'),
    (0, express_validator_1.body)('sender.address1')
        .trim()
        .notEmpty()
        .withMessage('Sender address line 1 is required')
        .isLength({ max: 44 })
        .withMessage('Sender address line 1 must be less than 45 characters'),
    (0, express_validator_1.body)('sender.city')
        .trim()
        .notEmpty()
        .withMessage('Sender city is required')
        .isLength({ max: 40 })
        .withMessage('Sender city must be less than 41 characters'),
    (0, express_validator_1.body)('sender.province')
        .trim()
        .notEmpty()
        .withMessage('Sender province is required')
        .isLength({ min: 2, max: 2 })
        .withMessage('Sender province must be a 2-letter code'),
    (0, express_validator_1.body)('sender.postalCode')
        .trim()
        .isPostalCode('CA')
        .withMessage('Invalid Canadian postal code')
        .bail()
        .customSanitizer(value => value.replace(/\s+/g, '').toUpperCase()),
    (0, express_validator_1.body)('sender.country')
        .default('CA')
        .isIn(['CA', 'US'])
        .withMessage('Only Canada and US are supported for now'),
    (0, express_validator_1.body)('shippingService')
        .trim()
        .notEmpty()
        .withMessage('Shipping service is required')
        .isIn([
        'DOM.RP', 'DOM.EP', 'DOM.PC', 'DOM.DT', 'DOM.XP', 'DOM.XP.CERT',
        'USA.EP', 'USA.PW.ENV', 'USA.PW.PAK', 'USA.PW.PARCEL',
        'INT.XP', 'INT.IP.AIR', 'INT.IP.SURF', 'INT.PW.PARCEL', 'INT.PW.PAK', 'INT.PW.ENV'
    ])
        .withMessage('Invalid shipping service code'),
    (0, express_validator_1.body)('reference')
        .optional()
        .trim()
        .isLength({ max: 35 })
        .withMessage('Reference must be less than 36 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .trim()
        .isLength({ max: 35 })
        .withMessage('Description must be less than 36 characters')
];
exports.validateCreateShipment = validateCreateShipment;
const validateTrackingNumber = () => [
    (0, express_validator_1.param)('trackingNumber')
        .trim()
        .notEmpty()
        .withMessage('Tracking number is required')
        .matches(/^[0-9]{16}$/)
        .withMessage('Invalid Canada Post tracking number format')
];
exports.validateTrackingNumber = validateTrackingNumber;
const validate = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => {
            const errorObj = err;
            return `${errorObj.param || 'unknown'}: ${errorObj.msg}`;
        }).join(', ');
        throw new canadaPost_1.CanadaPostError(`Validation failed: ${errorMessages}`, 'VALIDATION_ERROR', 400, 'https://developer.canadapost.ca/api/errors');
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
