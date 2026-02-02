import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { CanadaPostError } from '../types/canadaPost';

interface FieldValidationError {
  field: string;
  message: string;
  value?: any;
}

/*
  Middleware: validate request
  - sends proper error response
  - does NOT throw
  - includes field details
*/
export const validate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  const errorMessages: FieldValidationError[] = result.array().map(err => ({
    field: (err as any).path, // express-validator v7+
    message: err.msg as string,
    value: (err as any).value,
  }));

  if (errorMessages.length > 0) {
    return next(
      new CanadaPostError(
        'Validation failed',
        'VALIDATION_ERROR',
        400
      )
    );
  }
  
  return next();
};

/*
  Run validations sequentially
*/
export const runValidations = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      for (const validation of validations) {
        await validation.run(req);
      }

      validate(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};
