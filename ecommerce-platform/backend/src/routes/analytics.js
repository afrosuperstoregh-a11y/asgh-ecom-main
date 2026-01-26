const express = require('express');
const router = express.Router();

// Analytics routes
router.get('/dashboard', (req, res) => {
  try {
    // Mock analytics data
    const analyticsData = {
      overview: {
        totalRevenue: 125430.50,
        totalOrders: 847,
        totalCustomers: 1256,
        conversionRate: 3.2
      },
      revenueChart: [
        { date: '2024-01-01', revenue: 2340.50 },
        { date: '2024-01-02', revenue: 3456.00 },
        { date: '2024-01-03', revenue: 2890.75 },
        { date: '2024-01-04', revenue: 4123.25 },
        { date: '2024-01-05', revenue: 3678.00 }
      ],
      topProducts: [
        { name: 'Afro Print Dress', sales: 234, revenue: 11700.00 },
        { name: 'Kente Cloth Scarf', sales: 189, revenue: 9450.00 },
        { name: 'Ankara Headwrap', sales: 156, revenue: 4680.00 }
      ],
      recentOrders: [
        { id: 'ORD-001', customer: 'John Doe', amount: 89.99, status: 'completed' },
        { id: 'ORD-002', customer: 'Jane Smith', amount: 124.50, status: 'processing' },
        { id: 'ORD-003', customer: 'Mike Johnson', amount: 67.25, status: 'pending' }
      ]
    };

    res.json({
      success: true,
      data: analyticsData
    });
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data'
    });
  }
});

router.get('/sales', (req, res) => {
  try {
    const salesData = {
      daily: [
        { date: '2024-01-01', sales: 45, revenue: 2340.50 },
        { date: '2024-01-02', sales: 67, revenue: 3456.00 },
        { date: '2024-01-03', sales: 52, revenue: 2890.75 }
      ],
      weekly: [
        { week: '2024-W01', sales: 234, revenue: 12543.50 },
        { week: '2024-W02', sales: 289, revenue: 15678.00 },
        { week: '2024-W03', sales: 198, revenue: 10890.75 }
      ],
      monthly: [
        { month: '2024-01', sales: 847, revenue: 45678.50 },
        { month: '2024-02', sales: 923, revenue: 52345.00 },
        { month: '2024-03', sales: 756, revenue: 41234.75 }
      ]
    };

    res.json({
      success: true,
      data: salesData
    });
  } catch (error) {
    console.error('Sales analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales data'
    });
  }
});

router.get('/products', (req, res) => {
  try {
    const productAnalytics = {
      topSelling: [
        { id: 'PROD-001', name: 'Afro Print Dress', sales: 234, revenue: 11700.00 },
        { id: 'PROD-002', name: 'Kente Cloth Scarf', sales: 189, revenue: 9450.00 },
        { id: 'PROD-003', name: 'Ankara Headwrap', sales: 156, revenue: 4680.00 }
      ],
      lowStock: [
        { id: 'PROD-004', name: 'Dashiki Shirt', stock: 3, threshold: 10 },
        { id: 'PROD-005', name: 'African Beads', stock: 5, threshold: 15 }
      ],
      categoryPerformance: [
        { category: 'Clothing', sales: 456, revenue: 23400.00 },
        { category: 'Accessories', sales: 289, revenue: 8900.00 },
        { category: 'Home & Living', sales: 102, revenue: 5600.00 }
      ]
    };

    res.json({
      success: true,
      data: productAnalytics
    });
  } catch (error) {
    console.error('Product analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product analytics'
    });
  }
});

module.exports = router;
