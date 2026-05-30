const { ApiResponse, asyncHandler, validateRequest } = require('../../src/middleware/apiResponse');
const httpMocks = require('node-mocks-http');

describe('API Response Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
    next = jest.fn();
  });

  describe('ApiResponse.success', () => {
    it('should return a successful response with data', () => {
      const data = { id: 1, name: 'Test Product' };
      const message = 'Product retrieved successfully';

      ApiResponse.success(res, data, message, 200);

      expect(res.statusCode).toBe(200);
      const response = JSON.parse(res._getData());
      expect(response.success).toBe(true);
      expect(response.message).toBe(message);
      expect(response.data).toEqual(data);
      expect(response.error).toBeNull();
      expect(response.timestamp).toBeDefined();
    });

    it('should use default values when not provided', () => {
      ApiResponse.success(res);

      expect(res.statusCode).toBe(200);
      const response = JSON.parse(res._getData());
      expect(response.success).toBe(true);
      expect(response.message).toBe('Operation successful');
      expect(response.data).toBeNull();
    });
  });

  describe('ApiResponse.error', () => {
    it('should return an error response', () => {
      const message = 'Validation failed';
      const statusCode = 400;
      const error = { details: 'Invalid input' };

      ApiResponse.error(res, message, statusCode, error);

      expect(res.statusCode).toBe(statusCode);
      const response = JSON.parse(res._getData());
      expect(response.success).toBe(false);
      expect(response.message).toBe(message);
      expect(response.data).toBeNull();
      expect(response.error).toBe(error);
      expect(response.timestamp).toBeDefined();
    });

    it('should hide error details in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      ApiResponse.error(res, 'Server error', 500, 'Detailed error message');

      const response = JSON.parse(res._getData());
      expect(response.error).toBeNull();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('ApiResponse.validationError', () => {
    it('should return a validation error response', () => {
      const errors = [
        { field: 'email', message: 'Email is required' },
        { field: 'password', message: 'Password must be at least 8 characters' }
      ];

      ApiResponse.validationError(res, errors);

      expect(res.statusCode).toBe(400);
      const response = JSON.parse(res._getData());
      expect(response.success).toBe(false);
      expect(response.message).toBe('Validation failed');
      expect(response.error.type).toBe('validation');
      expect(response.error.details).toEqual(errors);
    });
  });

  describe('ApiResponse.notFound', () => {
    it('should return a 404 not found response', () => {
      ApiResponse.notFound(res, 'Product not found');

      expect(res.statusCode).toBe(404);
      const response = JSON.parse(res._getData());
      expect(response.success).toBe(false);
      expect(response.message).toBe('Product not found');
    });
  });

  describe('ApiResponse.unauthorized', () => {
    it('should return a 401 unauthorized response', () => {
      ApiResponse.unauthorized(res, 'Access token required');

      expect(res.statusCode).toBe(401);
      const response = JSON.parse(res._getData());
      expect(response.success).toBe(false);
      expect(response.message).toBe('Access token required');
    });
  });

  describe('ApiResponse.forbidden', () => {
    it('should return a 403 forbidden response', () => {
      ApiResponse.forbidden(res, 'Admin access required');

      expect(res.statusCode).toBe(403);
      const response = JSON.parse(res._getData());
      expect(response.success).toBe(false);
      expect(response.message).toBe('Admin access required');
    });
  });

  describe('asyncHandler', () => {
    it('should handle successful async functions', async () => {
      const middleware = asyncHandler(async (req, res, next) => {
        ApiResponse.success(res, { test: 'data' }, 'Success');
      });

      await middleware(req, res, next);

      expect(res.statusCode).toBe(200);
      const response = JSON.parse(res._getData());
      expect(response.success).toBe(true);
      expect(next).not.toHaveBeenCalled();
    });

    it('should catch and forward async errors', async () => {
      const error = new Error('Test error');
      const middleware = asyncHandler(async (req, res, next) => {
        throw error;
      });

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('validateRequest', () => {
    let mockSchema;

    beforeEach(() => {
      mockSchema = {
        validate: jest.fn()
      };
    });

    it('should pass validation when schema validates successfully', () => {
      mockSchema.validate.mockReturnValue({ error: null });
      req.body = { name: 'Test', email: 'test@example.com' };

      const middleware = validateRequest(mockSchema);
      middleware(req, res, next);

      expect(mockSchema.validate).toHaveBeenCalledWith(req.body);
      expect(next).toHaveBeenCalled();
    });

    it('should return validation error when schema fails', () => {
      mockSchema.validate.mockReturnValue({
        error: {
          details: [
            { path: ['email'], message: 'Email is required' }
          ]
        }
      });
      req.body = { name: 'Test' };

      const middleware = validateRequest(mockSchema);
      middleware(req, res, next);

      expect(res.statusCode).toBe(400);
      const response = JSON.parse(res._getData());
      expect(response.success).toBe(false);
      expect(response.message).toBe('Validation failed');
      expect(next).not.toHaveBeenCalled();
    });
  });
});
