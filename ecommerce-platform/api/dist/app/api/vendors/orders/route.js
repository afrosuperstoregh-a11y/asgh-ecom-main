"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.PUT = PUT;
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
const next_auth_1 = require("next-auth");
const auth_1 = require("@/lib/auth");
const zod_1 = require("zod");
const vendorOrderUpdateSchema = zod_1.z.object({
    status: zod_1.z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
    trackingNumber: zod_1.z.string().optional(),
    carrier: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
const shippingSchema = zod_1.z.object({
    trackingNumber: zod_1.z.string().min(1),
    carrier: zod_1.z.string().min(1),
    notes: zod_1.z.string().optional(),
});
async function GET(request) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        const vendor = await prisma_1.prisma.vendor.findUnique({
            where: { userId: session.user.id },
        });
        if (!vendor) {
            return server_1.NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
        }
        const where = { vendorId: vendor.id };
        if (status) {
            where.status = status.toUpperCase();
        }
        if (search) {
            where.OR = [
                { vendorOrderNumber: { contains: search, mode: 'insensitive' } },
                { order: { orderNumber: { contains: search, mode: 'insensitive' } } },
            ];
        }
        const [orders, total] = await Promise.all([
            prisma_1.prisma.vendorOrder.findMany({
                where,
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
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma_1.prisma.vendorOrder.count({ where }),
        ]);
        return server_1.NextResponse.json({
            orders,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        console.error('Get vendor orders error:', error);
        return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
async function PUT(request) {
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
        const body = await request.json();
        const { orderId, ...updateData } = body;
        if (!orderId) {
            return server_1.NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }
        const validatedData = vendorOrderUpdateSchema.parse(updateData);
        // Check if order exists and belongs to vendor
        const vendorOrder = await prisma_1.prisma.vendorOrder.findFirst({
            where: {
                id: orderId,
                vendorId: vendor.id,
            },
        });
        if (!vendorOrder) {
            return server_1.NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }
        // Validate status transitions
        const validTransitions = {
            'PENDING': ['PROCESSING', 'CANCELLED'],
            'PROCESSING': ['SHIPPED', 'CANCELLED'],
            'SHIPPED': ['DELIVERED'],
            'DELIVERED': ['REFUNDED'],
            'CANCELLED': [],
            'REFUNDED': [],
        };
        if (validatedData.status && !validTransitions[vendorOrder.status].includes(validatedData.status)) {
            return server_1.NextResponse.json({ error: `Invalid status transition from ${vendorOrder.status} to ${validatedData.status}` }, { status: 400 });
        }
        const updateFields = { ...validatedData };
        // Set timestamps based on status
        if (validatedData.status === 'SHIPPED') {
            updateFields.shippedAt = new Date();
        }
        else if (validatedData.status === 'DELIVERED') {
            updateFields.deliveredAt = new Date();
        }
        const updatedOrder = await prisma_1.prisma.vendorOrder.update({
            where: { id: orderId },
            data: updateFields,
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
        });
        // Update main order status if all vendor orders are shipped/delivered
        if (validatedData.status === 'SHIPPED' || validatedData.status === 'DELIVERED') {
            const allVendorOrders = await prisma_1.prisma.vendorOrder.findMany({
                where: { orderId: vendorOrder.orderId },
            });
            const allShipped = allVendorOrders.every(order => order.status === 'SHIPPED' || order.status === 'DELIVERED');
            const allDelivered = allVendorOrders.every(order => order.status === 'DELIVERED');
            let mainOrderStatus;
            if (allDelivered) {
                mainOrderStatus = 'DELIVERED';
            }
            else if (allShipped) {
                mainOrderStatus = 'SHIPPED';
            }
            else {
                mainOrderStatus = 'PROCESSING';
            }
            await prisma_1.prisma.order.update({
                where: { id: vendorOrder.orderId },
                data: {
                    status: mainOrderStatus,
                    ...(validatedData.status === 'SHIPPED' && { shippedAt: new Date() }),
                    ...(validatedData.status === 'DELIVERED' && { deliveredAt: new Date() }),
                },
            });
        }
        // Send notification to customer
        // await notificationService.notifyOrderStatusUpdate(updatedOrder);
        return server_1.NextResponse.json({
            message: 'Order updated successfully',
            order: updatedOrder,
        });
    }
    catch (error) {
        console.error('Update vendor order error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return server_1.NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
        }
        return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
