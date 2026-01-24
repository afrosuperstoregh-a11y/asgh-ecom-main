export async function POST(request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return Response.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required'
        }
      }, { status: 400 });
    }

    if (password.length < 8) {
      return Response.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password must be at least 8 characters long'
        }
      }, { status: 400 });
    }

    // Mock registration - replace with real registration logic
    return Response.json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: Date.now(),
          email,
          name: name || 'New User'
        }
      }
    });

  } catch (error) {
    return Response.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Registration failed'
      }
    }, { status: 500 });
  }
}
