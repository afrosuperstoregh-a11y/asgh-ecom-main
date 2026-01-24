import { body, param,validationResult, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { CanadaPostError } from '../types/canadaPost';

export const validateGetRates = (): ValidationChain[] => [
  body('originPostalCode')
    .trim()
    .isPostalCode('CA')
    .withMessage('Invalid Canadian postal code')
    .bail()
    .customSanitizer(value => value.replace(/\s+/g, '').toUpperCase()),
    
  body('destination.postalCode')
    .trim()
    .isPostalCode('CA')
    .withMessage('Invalid Canadian postal code')
    .bail()
    .customSanitizer(value => value.replace(/\s+/g, '').toUpperCase()),
    
  body('destination.name')
    .trim()
    .notEmpty()
    .withMessage('Recipient name is required')
    .isLength({ max: 44 })
    .withMessage('Name must be less than 45 characters'),
    
  body('destination.address1')
    .trim()
    .notEmpty()
    .withMessage('Address line 1 is required')
    .isLength({ max: 44 })
    .withMessage('Address line 1 must be less than 45 characters'),
    
  body('destination.city')
    .trim()
    .notEmpty()
    .withMessage('City is required')
    .isLength({ max: 40 })
    .withMessage('City must be less than 41 characters'),
    
  body('destination.province')
    .trim()
    .notEmpty()
    .withMessage('Province is required')
    .isLength({ min: 2, max: 2 })
    .withMessage('Province must be a 2-letter code'),
    
  body('parcel.weight')
    .isFloat({ min: 0.1, max: 30 })
    .withMessage('Weight must be between 0.1kg and 30kg'),
    
  body('parcel.length')
    .isFloat({ min: 10, max: 200 })
    .withMessage('Length must be between 10cm and 200cm'),
    
  body('parcel.width')
    .isFloat({ min: 1.7, max: 200 })
    .withMessage('Width must be between 1.7cm and 200cm'),
    
  body('parcel.height')
    .isFloat({ min: 1.7, max: 200 })
    .withMessage('Height must be between 1.7cm and 200cm'),
    
  body('options.insuranceValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Insurance value must be a positive number'),
    
  body('options.signatureRequired')
    .optional()
    .isBoolean()
    .withMessage('Signature required must be a boolean')
];

export const validateCreateShipment = (): ValidationChain[] => [
  ...validateGetRates(),
  
  body('sender.name')
    .trim()
    .notEmpty()
    .withMessage('Sender name is required')
    .isLength({ max: 44 })
    .withMessage('Sender name must be less than 45 characters'),
    
  body('sender.address1')
    .trim()
    .notEmpty()
    .withMessage('Sender address line 1 is required')
    .isLength({ max: 44 })
    .withMessage('Sender address line 1 must be less than 45 characters'),
    
  body('sender.city')
    .trim()
    .notEmpty()
    .withMessage('Sender city is required')
    .isLength({ max: 40 })
    .withMessage('Sender city must be less than 41 characters'),
    
  body('sender.province')
    .trim()
    .notEmpty()
    .withMessage('Sender province is required')
    .isLength({ min: 2, max: 2 })
    .withMessage('Sender province must be a 2-letter code'),
    
  body('sender.postalCode')
    .trim()
    .isPostalCode('CA')
    .withMessage('Invalid Canadian postal code')
    .bail()
    .customSanitizer(value => value.replace(/\s+/g, '').toUpperCase()),
    
  body('sender.country')
    .default('CA')
    .isIn(['CA', 'US'])
    .withMessage('Only Canada and US are supported for now'),
    
  body('shippingService')
    .trim()
    .notEmpty()
    .withMessage('Shipping service is required')
    .isIn([
      'DOM.RP', 'DOM.EP', 'DOM.PC', 'DOM.DT', 'DOM.XP', 'DOM.XP.CERT', 
      'USA.EP', 'USA.PW.ENV', 'USA.PW.PAK', 'USA.PW.PARCEL',
      'INT.XP', 'INT.IP.AIR', 'INT.IP.SURF', 'INT.PW.PARCEL', 'INT.PW.PAK', 'INT.PW.ENV'
    ])
    .withMessage('Invalid shipping service code'),
    
  body('reference')
    .optional()
    .trim()
    .isLength({ max: 35 })
    .withMessage('Reference must be less than 36 characters'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 35 })
    .withMessage('Description must be less than 36 characters')
];

export const validateTrackingNumber = (): ValidationChain[] => [
  param('trackingNumber')
    .trim()
    .notEmpty()
    .withMessage('Tracking number is required')
    .matches(/^[0-9]{16}$/)
    .withMessage('Invalid Canada Post tracking number format')
];

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => {
      const errorObj = err as { param?: string; msg: string; value?: any };
      return `${errorObj.param || 'unknown'}: ${errorObj.msg}`;
    }).join(', ');
    
    throw new CanadaPostError(
      `Validation failed: ${errorMessages}`, 
      'VALIDATION_ERROR', 
      400, 
      'https://developer.canadapost.ca/api/errors'
    );
  }
  
  next();
};

// Helper to run validations in sequence
export const runValidations = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    validate(req, res, next);
  };
};