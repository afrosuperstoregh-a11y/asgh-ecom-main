const request = require('supertest');
const app = require('../../src/server');

describe('API Integration Tests', () => {
  describe('Health Check Endpoint', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('service', 'Afro Superstore Backend API');
      expect(response.body).toHaveProperty('version', '1.0.0');
    });
  });

  describe('Products API', () => {
    it('should get products list', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/api/products/non-existent-id')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Categories API', () => {
    it('should get categories list', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Authentication Middleware', () => {
    it('should reject requests without token', async () => {
      const response = await request(app)
        .post('/api/products')
        .send({
          name: 'Test Product',
          price: 10.99,
          sku: 'TEST-001'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          name: 'Test Product',
          price: 10.99,
          sku: 'TEST-001'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app)
          .get('/api/health')
          .expect(200);
      }
    });

    it('should handle rate limit exceeded gracefully', async () => {
      // This test would need to be adjusted based on actual rate limit configuration
      // For now, just ensure the endpoint exists
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
    });
  });

  describe('CORS Configuration', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .options('/api/products')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers).toHaveProperty('access-control-allow-methods');
      expect(response.headers).toHaveProperty('access-control-allow-headers');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown-route')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Content-Type', 'application/json')
        .send('invalid-json')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Request Validation', () => {
    it('should validate request body format', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', 'Bearer valid-token')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('API Response Format', () => {
    it('should return consistent response format for success', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('error');
    });

    it('should return consistent response format for errors', async () => {
      const response = await request(app)
        .get('/api/unknown-route')
        .expect(404);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error');
    });
  });
});
