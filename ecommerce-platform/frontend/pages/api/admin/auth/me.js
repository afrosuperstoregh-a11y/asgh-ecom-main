// Mock Admin Auth Me API for development
// Returns current admin user info

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check authorization
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);
  
  // Validate token format (basic check)
  if (!token.startsWith('prod-jwt-token-')) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Mock user data
  const mockUser = {
    success: true,
    user: {
      id: "admin-001",
      email: "admin@afrosuperstore.ca",
      name: "Super Admin",
      role: "super_admin",
      permissions: ["read", "write", "delete", "admin", "super_admin"],
      created_at: new Date().toISOString()
    }
  };

  res.status(200).json(mockUser);
}
