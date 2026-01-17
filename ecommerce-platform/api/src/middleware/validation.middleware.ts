import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain, ValidationError } from 'express-validator';
import { CanadaPostError } from '../types/canadaPost';

interface FieldValidationError {
  field: string;
  message: string;
  value?: any;
}

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages: FieldValidationError[] = [];
    
    errors.array().forEach((error: ValidationError) => {
      if ('param' in error) {
        errorMessages.push({
          field: error.param,
          message: error.msg,
          value: 'value' in error ? error.value : undefined,
        });
      } else if (error.nestedErrors) {
        // Handle nested errors if needed
        (error.nestedErrors as ValidationError[]).forEach(nestedError => {
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
      throw new CanadaPostError(
        'Validation failed', 
        'VALIDATION_ERROR', 
        400, 
        'https://developer.canadapost.ca/api/errors'
      );
    }
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
