// Global error handling utilities for admin panel

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export interface ErrorContext {
  action: string;
  component?: string;
  userId?: string;
  additionalInfo?: Record<string, any>;
}

// Error types for better categorization
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Standardized error class
export class AdminError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly context: ErrorContext;
  public readonly originalError?: any;
  public readonly timestamp: Date;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: ErrorContext,
    originalError?: any
  ) {
    super(message);
    this.name = 'AdminError';
    this.type = type;
    this.severity = severity;
    this.context = context;
    this.originalError = originalError;
    this.timestamp = new Date();
  }
}

// Error handler class
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: AdminError[] = [];
  private maxLogSize = 1000;

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Categorize error based on status code and error characteristics
  private categorizeError(error: any, status?: number): ErrorType {
    if (error.name === 'ValidationError' || error.issues) {
      return ErrorType.VALIDATION;
    }
    
    if (status === 401 || error.message?.includes('unauthorized')) {
      return ErrorType.AUTHENTICATION;
    }
    
    if (status === 403 || error.message?.includes('forbidden')) {
      return ErrorType.AUTHORIZATION;
    }
    
    if (status === 404 || error.message?.includes('not found')) {
      return ErrorType.NOT_FOUND;
    }
    
    if (status && status >= 500) {
      return ErrorType.SERVER;
    }
    
    if (error.name === 'NetworkError' || !navigator.onLine) {
      return ErrorType.NETWORK;
    }
    
    return ErrorType.UNKNOWN;
  }

  // Determine error severity
  private determineSeverity(type: ErrorType, status?: number): ErrorSeverity {
    switch (type) {
      case ErrorType.AUTHENTICATION:
      case ErrorType.AUTHORIZATION:
        return ErrorSeverity.HIGH;
      case ErrorType.SERVER:
        return status === 500 ? ErrorSeverity.CRITICAL : ErrorSeverity.HIGH;
      case ErrorType.NETWORK:
        return ErrorSeverity.MEDIUM;
      case ErrorType.VALIDATION:
        return ErrorSeverity.LOW;
      case ErrorType.NOT_FOUND:
        return ErrorSeverity.MEDIUM;
      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  // Handle API errors
  public handleApiError(
    error: any,
    context: ErrorContext,
    status?: number
  ): AdminError {
    const type = this.categorizeError(error, status);
    const severity = this.determineSeverity(type, status);
    
    // Extract user-friendly message
    let message = 'An unexpected error occurred';
    
    if (error.message) {
      message = error.message;
    } else if (error.data?.message) {
      message = error.data.message;
    } else if (typeof error === 'string') {
      message = error;
    } else if (status) {
      switch (status) {
        case 400:
          message = 'Invalid request. Please check your input.';
          break;
        case 401:
          message = 'You need to be logged in to perform this action.';
          break;
        case 403:
          message = 'You don\'t have permission to perform this action.';
          break;
        case 404:
          message = 'The requested resource was not found.';
          break;
        case 429:
          message = 'Too many requests. Please try again later.';
          break;
        case 500:
          message = 'Server error. Please try again later.';
          break;
        case 503:
          message = 'Service unavailable. Please try again later.';
          break;
        default:
          message = `Request failed with status ${status}.`;
      }
    }

    const adminError = new AdminError(message, type, severity, context, error);
    this.logError(adminError);
    
    return adminError;
  }

  // Handle form validation errors
  public handleValidationError(
    errors: Record<string, string>,
    context: ErrorContext
  ): AdminError {
    const message = 'Please correct the errors in the form';
    const adminError = new AdminError(
      message,
      ErrorType.VALIDATION,
      ErrorSeverity.LOW,
      { ...context, additionalInfo: { validationErrors: errors } }
    );
    this.logError(adminError);
    return adminError;
  }

  // Handle network errors
  public handleNetworkError(
    error: any,
    context: ErrorContext
  ): AdminError {
    const message = !navigator.onLine 
      ? 'You appear to be offline. Please check your internet connection.'
      : 'Network error. Please check your connection and try again.';
    
    const adminError = new AdminError(
      message,
      ErrorType.NETWORK,
      ErrorSeverity.MEDIUM,
      context,
      error
    );
    this.logError(adminError);
    return adminError;
  }

  // Log errors (in production, this would send to a logging service)
  private logError(error: AdminError): void {
    this.errorLog.push(error);
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 [ERROR] ${error.type} - ${error.severity}`);
      console.error('Message:', error.message);
      console.error('Context:', error.context);
      console.error('Timestamp:', error.timestamp);
      if (error.originalError) {
        console.error('Original Error:', error.originalError);
      }
      console.groupEnd();
    }

    // In production, you would send this to your logging service
    // this.sendToLoggingService(error);
  }

  // Get user-friendly error message
  public getUserMessage(error: AdminError): string {
    return error.message;
  }

  // Get error log for debugging
  public getErrorLog(): AdminError[] {
    return [...this.errorLog];
  }

  // Clear error log
  public clearErrorLog(): void {
    this.errorLog = [];
  }

  // Check if error should be reported to user
  public shouldReportToUser(error: AdminError): boolean {
    return error.severity !== ErrorSeverity.LOW || error.type === ErrorType.VALIDATION;
  }

  // Check if error requires user action
  public requiresUserAction(error: AdminError): boolean {
    return [
      ErrorType.VALIDATION,
      ErrorType.AUTHENTICATION,
      ErrorType.AUTHORIZATION
    ].includes(error.type);
  }
}

// Convenience function for handling API calls with error handling
export async function withErrorHandling<T>(
  apiCall: () => Promise<T>,
  context: ErrorContext,
  errorHandler: ErrorHandler = ErrorHandler.getInstance()
): Promise<{ data?: T; error?: AdminError }> {
  try {
    const data = await apiCall();
    return { data };
  } catch (error: any) {
    const status = error.response?.status || error.status;
    const adminError = errorHandler.handleApiError(error, context, status);
    return { error: adminError };
  }
}

// React hook for error handling
export function useErrorHandler() {
  const errorHandler = ErrorHandler.getInstance();

  const handleError = (error: any, context: ErrorContext, status?: number) => {
    return errorHandler.handleApiError(error, context, status);
  };

  const handleValidationError = (errors: Record<string, string>, context: ErrorContext) => {
    return errorHandler.handleValidationError(errors, context);
  };

  const handleNetworkError = (error: any, context: ErrorContext) => {
    return errorHandler.handleNetworkError(error, context);
  };

  const getUserMessage = (error: AdminError) => {
    return errorHandler.getUserMessage(error);
  };

  const shouldReportToUser = (error: AdminError) => {
    return errorHandler.shouldReportToUser(error);
  };

  const requiresUserAction = (error: AdminError) => {
    return errorHandler.requiresUserAction(error);
  };

  return {
    handleError,
    handleValidationError,
    handleNetworkError,
    getUserMessage,
    shouldReportToUser,
    requiresUserAction,
    errorHandler
  };
}

export default ErrorHandler;
