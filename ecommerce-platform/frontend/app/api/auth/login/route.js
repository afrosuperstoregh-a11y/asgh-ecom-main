export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required'
        }
      }, { status: 400 });
    }

    // Mock authentication - replace with real auth logic
    if (email === 'demo@example.com' && password === 'password123') {
      return Response.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: 1,
            email: 'demo@example.com',
            name: 'Demo User'
          },
          token: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token'
        }
      });
    }

    return Response.json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid credentials'
      }
    }, { status: 401 });

  } catch (error) {
    return Response.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Login failed'
      }
    }, { status: 500 });
  }
}
