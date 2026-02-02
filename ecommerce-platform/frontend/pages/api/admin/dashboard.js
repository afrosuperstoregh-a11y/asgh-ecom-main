// Mock Admin Dashboard API for development
// This provides mock data when backend is not deployed

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

  // Mock dashboard data
  const mockData = {
    success: true,
    data: {
      stats: {
        totalOrders: 1247,
        totalRevenue: 45890.50,
        totalUsers: 892,
        totalProducts: 156
      },
      recentOrders: [
        {
          order_number: "ORD-2024-001",
          email: "customer1@example.com",
          total_amount: 125.99,
          status: "PENDING",
          created_at: new Date().toISOString()
        },
        {
          order_number: "ORD-2024-002", 
          email: "customer2@example.com",
          total_amount: 89.50,
          status: "PROCESSING",
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          order_number: "ORD-2024-003",
          email: "customer3@example.com", 
          total_amount: 210.75,
          status: "SHIPPED",
          created_at: new Date(Date.now() - 7200000).toISOString()
        }
      ],
      topProducts: [],
      lowStockProducts: []
    }
  };

  res.status(200).json(mockData);
}
