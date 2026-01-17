const express = require('express');
const { PrismaClient } = require('@prisma/client');
const asyncHandler = require('express-async-handler');

const router = express.Router();
const prisma = new PrismaClient();

// Get dashboard overview stats
router.get('/overview', asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // Get current month stats
  const [
    totalOrders,
    totalRevenue,
    totalCustomers,
    totalProducts,
    currentMonthOrders,
    currentMonthRevenue,
    lastMonthOrders,
    lastMonthRevenue,
    recentOrders,
    topProducts,
    lowStockProducts,
    pendingOrders
  ] = await Promise.all([
    // Total stats
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { total: true } }),
    prisma.user.count(),
    prisma.product.count({ where: { status: 'ACTIVE' } }),
    
    // Current month stats
    prisma.order.count({
      where: { createdAt: { gte: startOfMonth } }
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: startOfMonth } },
      _sum: { total: true }
    }),
    
    // Last month stats
    prisma.order.count({
      where: { 
        createdAt: { 
          gte: startOfLastMonth,
          lte: endOfLastMonth
        } 
      }
    }),
    prisma.order.aggregate({
      where: { 
        createdAt: { 
          gte: startOfLastMonth,
          lte: endOfLastMonth
        } 
      },
      _sum: { total: true }
    }),
    
    // Recent orders
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    }),
    
    // Top products by revenue
    prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 5
    }),
    
    // Low stock products
    prisma.productVariant.findMany({
      where: {
        trackInventory: true,
        stock: { lte: 10 }
      },
      include: {
        product: {
          select: { name: true, sku: true }
        }
      },
      take: 10,
      orderBy: { stock: 'asc' }
    }),
    
    // Pending orders
    prisma.order.count({
      where: { status: 'PENDING' }
    })
  ]);

  // Get product details for top products
  const topProductIds = topProducts.map(p => p.productId);
  const topProductDetails = await prisma.product.findMany({
    where: { id: { in: topProductIds } },
    select: { id: true, name: true, sku: true, images: true }
  });

  const topProductsWithDetails = topProducts.map(product => {
    const details = topProductDetails.find(p => p.id === product.productId);
    return {
      ...product,
      product: details
    };
  });

  // Calculate growth percentages
  const orderGrowth = lastMonthOrders > 0 
    ? ((currentMonthOrders - lastMonthOrders) / lastMonthOrders) * 100 
    : 0;
  
  const revenueGrowth = lastMonthRevenue._sum.total 
    ? ((currentMonthRevenue._sum.total - lastMonthRevenue._sum.total) / lastMonthRevenue._sum.total) * 100 
    : 0;

  res.json({
    overview: {
      totalOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      totalCustomers,
      totalProducts,
      pendingOrders
    },
    growth: {
      orders: Math.round(orderGrowth * 100) / 100,
      revenue: Math.round(revenueGrowth * 100) / 100
    },
    currentMonth: {
      orders: currentMonthOrders,
      revenue: currentMonthRevenue._sum.total || 0
    },
    recentOrders,
    topProducts: topProductsWithDetails,
    lowStockProducts
  });
}));

// Get sales chart data
router.get('/sales-chart', asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;
  
  let startDate;
  let groupBy;
  
  switch (period) {
    case '7d':
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      groupBy = 'day';
      break;
    case '30d':
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      groupBy = 'day';
      break;
    case '90d':
      startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      groupBy = 'week';
      break;
    case '1y':
      startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      groupBy = 'month';
      break;
    default:
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      groupBy = 'day';
  }

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startDate }
    },
    select: {
      createdAt: true,
      total: true,
      status: true
    },
    orderBy: { createdAt: 'asc' }
  });

  // Group orders by period
  const groupedData = {};
  
  orders.forEach(order => {
    let key;
    const date = new Date(order.createdAt);
    
    switch (groupBy) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
    }
    
    if (!groupedData[key]) {
      groupedData[key] = {
        date: key,
        orders: 0,
        revenue: 0,
        uniqueCustomers: new Set()
      };
    }
    
    groupedData[key].orders++;
    groupedData[key].revenue += Number(order.total);
  });

  const chartData = Object.values(groupedData).map(item => ({
    ...item,
    uniqueCustomers: item.uniqueCustomers.size,
    revenue: Math.round(item.revenue * 100) / 100
  }));

  res.json(chartData);
}));

// Get top categories by revenue
router.get('/top-categories', asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;

  const categories = await prisma.category.findMany({
    include: {
      products: {
        include: {
          orderItems: {
            include: {
              order: {
                select: { status: true }
              }
            }
          }
        }
      }
    }
  });

  const categoriesWithRevenue = categories.map(category => {
    const totalRevenue = category.products.reduce((sum, product) => {
      const productRevenue = product.orderItems
        .filter(item => item.order.status !== 'CANCELLED')
        .reduce((itemSum, item) => itemSum + Number(item.total), 0);
      return sum + productRevenue;
    }, 0);

    const totalOrders = category.products.reduce((sum, product) => {
      return sum + product.orderItems.filter(item => item.order.status !== 'CANCELLED').length;
    }, 0);

    return {
      id: category.id,
      name: category.name,
      revenue: totalRevenue,
      orders: totalOrders,
      productCount: category.products.length
    };
  });

  const sortedCategories = categoriesWithRevenue
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, parseInt(limit));

  res.json(sortedCategories);
}));

// Get customer analytics
router.get('/customer-analytics', asyncHandler(async (req, res) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalCustomers,
    newCustomers,
    returningCustomers,
    topCustomers,
    customerGrowth
  ] = await Promise.all([
    // Total customers
    prisma.user.count(),
    
    // New customers (last 30 days)
    prisma.user.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    }),
    
    // Returning customers (customers with more than 1 order)
    prisma.user.count({
      where: {
        orders: {
          some: {}
        }
      }
    }),
    
    // Top customers by total spent
    prisma.user.findMany({
      include: {
        orders: {
          where: { status: { not: 'CANCELLED' } },
          select: { total: true }
        }
      },
      take: 10
    }),
    
    // Customer growth over time
    prisma.user.findMany({
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' }
    })
  ]);

  // Calculate total spent for each customer
  const customersWithSpending = topCustomers.map(customer => {
    const totalSpent = customer.orders.reduce((sum, order) => sum + Number(order.total), 0);
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      totalSpent,
      orderCount: customer.orders.length
    };
  }).sort((a, b) => b.totalSpent - a.totalSpent);

  // Group customer growth by month
  const growthByMonth = {};
  customerGrowth.forEach(customer => {
    const month = customer.createdAt.toISOString().slice(0, 7);
    growthByMonth[month] = (growthByMonth[month] || 0) + 1;
  });

  const cumulativeGrowth = [];
  let cumulative = 0;
  Object.entries(growthByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([month, count]) => {
      cumulative += count;
      cumulativeGrowth.push({ month, newCustomers: count, totalCustomers: cumulative });
    });

  res.json({
    totalCustomers,
    newCustomers,
    returningCustomers,
    topCustomers: customersWithSpending,
    growth: cumulativeGrowth
  });
}));

module.exports = router;
