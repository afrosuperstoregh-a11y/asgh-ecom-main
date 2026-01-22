"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
const next_auth_1 = require("next-auth");
const auth_1 = require("@/lib/auth");
async function GET(request) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const vendor = await prisma_1.prisma.vendor.findUnique({
            where: { userId: session.user.id },
        });
        if (!vendor) {
            return server_1.NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
        }
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        // Get dashboard metrics
        const [totalProducts, activeProducts, pendingProducts, totalOrders, thisMonthOrders, lastMonthOrders, totalRevenue, thisMonthRevenue, lastMonthRevenue, pendingPayouts, recentOrders, topProducts, unreadNotifications,] = await Promise.all([
            // Product counts
            prisma_1.prisma.vendorProduct.count({
                where: { vendorId: vendor.id },
            }),
            prisma_1.prisma.vendorProduct.count({
                where: {
                    vendorId: vendor.id,
                    approvalStatus: 'APPROVED',
                },
            }),
            prisma_1.prisma.vendorProduct.count({
                where: {
                    vendorId: vendor.id,
                    approvalStatus: 'PENDING',
                },
            }),
            // Order counts
            prisma_1.prisma.vendorOrder.count({
                where: { vendorId: vendor.id },
            }),
            prisma_1.prisma.vendorOrder.count({
                where: {
                    vendorId: vendor.id,
                    createdAt: { gte: startOfMonth },
                },
            }),
            prisma_1.prisma.vendorOrder.count({
                where: {
                    vendorId: vendor.id,
                    createdAt: {
                        gte: startOfLastMonth,
                        lte: endOfLastMonth,
                    },
                },
            }),
            // Revenue
            prisma_1.prisma.vendorOrder.aggregate({
                where: { vendorId: vendor.id },
                _sum: { vendorEarnings: true },
            }),
            prisma_1.prisma.vendorOrder.aggregate({
                where: {
                    vendorId: vendor.id,
                    createdAt: { gte: startOfMonth },
                },
                _sum: { vendorEarnings: true },
            }),
            prisma_1.prisma.vendorOrder.aggregate({
                where: {
                    vendorId: vendor.id,
                    createdAt: {
                        gte: startOfLastMonth,
                        lte: endOfLastMonth,
                    },
                },
                _sum: { vendorEarnings: true },
            }),
            // Pending payouts
            prisma_1.prisma.vendorPayout.aggregate({
                where: {
                    vendorId: vendor.id,
                    status: 'PENDING',
                },
                _sum: { amount: true },
                _count: true,
            }),
            // Recent orders
            prisma_1.prisma.vendorOrder.findMany({
                where: { vendorId: vendor.id },
                include: {
                    order: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                },
                            },
                        },
                    },
                    items: {
                        include: {
                            vendorProduct: {
                                include: {
                                    product: {
                                        select: {
                                            id: true,
                                            name: true,
                                            images: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: 5,
            }),
            // Top products
            prisma_1.prisma.vendorOrderItem.groupBy({
                by: ['vendorProductId'],
                where: {
                    vendorOrder: { vendorId: vendor.id },
                },
                _sum: {
                    quantity: true,
                    totalPrice: true,
                },
                _count: {
                    vendorOrderId: true,
                },
                orderBy: {
                    _sum: {
                        totalPrice: 'desc',
                    },
                },
                take: 5,
            }),
            // Unread notifications
            prisma_1.prisma.vendorNotification.count({
                where: {
                    vendorId: vendor.id,
                    isRead: false,
                },
            }),
        ]);
        // Fetch product details for top products
        const topProductIds = topProducts.map(p => p.vendorProductId);
        const topProductDetails = await prisma_1.prisma.vendorProduct.findMany({
            where: { id: { in: topProductIds } },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        images: true,
                    },
                },
            },
        });
        // Combine top products with their details
        const topProductsWithDetails = topProducts.map(topProduct => {
            const details = topProductDetails.find(p => p.id === topProduct.vendorProductId);
            return {
                ...topProduct,
                product: details?.product,
            };
        });
        const dashboard = {
            vendor: {
                id: vendor.id,
                businessName: vendor.businessName,
                verificationStatus: vendor.verificationStatus,
                rating: vendor.rating,
                totalReviews: vendor.totalReviews,
                isActive: vendor.isActive,
            },
            metrics: {
                products: {
                    total: totalProducts,
                    active: activeProducts,
                    pending: pendingProducts,
                },
                orders: {
                    total: totalOrders,
                    thisMonth: thisMonthOrders,
                    lastMonth: lastMonthOrders,
                    growth: lastMonthOrders > 0 ?
                        ((thisMonthOrders - lastMonthOrders) / lastMonthOrders * 100).toFixed(1) :
                        thisMonthOrders > 0 ? '100.0' : '0.0',
                },
                revenue: {
                    total: totalRevenue._sum.vendorEarnings || 0,
                    thisMonth: thisMonthRevenue._sum.vendorEarnings || 0,
                    lastMonth: lastMonthRevenue._sum.vendorEarnings || 0,
                    growth: lastMonthRevenue._sum.vendorEarnings && lastMonthRevenue._sum.vendorEarnings > 0 ?
                        (((thisMonthRevenue._sum.vendorEarnings || 0) - (lastMonthRevenue._sum.vendorEarnings || 0)) / (lastMonthRevenue._sum.vendorEarnings || 1) * 100).toFixed(1) :
                        (thisMonthRevenue._sum.vendorEarnings || 0) > 0 ? '100.0' : '0.0',
                },
                payouts: {
                    pending: pendingPayouts._count,
                    pendingAmount: pendingPayouts._sum.amount || 0,
                },
                notifications: {
                    unread: unreadNotifications,
                },
            },
            recent: {
                orders: recentOrders,
                topProducts: topProductsWithDetails,
            },
        };
        return server_1.NextResponse.json({ dashboard });
    }
    catch (error) {
        console.error('Get vendor dashboard error:', error);
        return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
