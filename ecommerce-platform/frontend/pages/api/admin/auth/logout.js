// Mock Admin Logout API for development
// Handles logout requests

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check authorization
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Mock logout response
  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
}
