export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Access token is required'
        }
      }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Mock token validation - replace with real JWT validation
    if (token === 'mock-jwt-token') {
      return Response.json({
        success: true,
        data: {
          user: {
            id: 1,
            email: 'demo@example.com',
            name: 'Demo User'
          }
        }
      });
    }

    return Response.json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token'
      }
    }, { status: 401 });

  } catch (error) {
    return Response.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to authenticate'
      }
    }, { status: 500 });
  }
}
