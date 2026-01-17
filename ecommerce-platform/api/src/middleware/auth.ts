import { Request, Response, NextFunction } from 'express';
import { SecurityUtils } from '../utils/security';
import { ApiError } from '../utils/ApiError';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw ApiError.unauthorized('Authorization header is required');
    }

    const token = SecurityUtils.extractTokenFromHeader(authHeader);
    const decoded = SecurityUtils.verifyToken(token);

    req.user = {
      userId: decoded.userId,
      email: decoded.email
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const token = SecurityUtils.extractTokenFromHeader(authHeader);
      const decoded = SecurityUtils.verifyToken(token);

      req.user = {
        userId: decoded.userId,
        email: decoded.email
      };
    }

    next();
  } catch (error) {
    // For optional auth, we don't throw errors, just continue without user
    next();
  }
};
