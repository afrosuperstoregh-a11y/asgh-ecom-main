import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const vendorOrderUpdateSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
  notes: z.string().optional(),
});

const shippingSchema = z.object({
  trackingNumber: z.string().min(1),
  carrier: z.string().min(1),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const vendor = await prisma.vendor.findUnique({
      where: { userId: session.user.id },
    });

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    const where: any = { vendorId: vendor.id };
    
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
      prisma.vendorOrder.findMany({
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
      prisma.vendorOrder.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get vendor orders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const vendor = await prisma.vendor.findUnique({
      where: { userId: session.user.id },
    });

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { orderId, ...updateData } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const validatedData = vendorOrderUpdateSchema.parse(updateData);

    // Check if order exists and belongs to vendor
    const vendorOrder = await prisma.vendorOrder.findFirst({
      where: {
        id: orderId,
        vendorId: vendor.id,
      },
    });

    if (!vendorOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      'PENDING': ['PROCESSING', 'CANCELLED'],
      'PROCESSING': ['SHIPPED', 'CANCELLED'],
      'SHIPPED': ['DELIVERED'],
      'DELIVERED': ['REFUNDED'],
      'CANCELLED': [],
      'REFUNDED': [],
    };

    if (validatedData.status && !validTransitions[vendorOrder.status].includes(validatedData.status)) {
      return NextResponse.json(
        { error: `Invalid status transition from ${vendorOrder.status} to ${validatedData.status}` },
        { status: 400 }
      );
    }

    const updateFields: any = { ...validatedData };
    
    // Set timestamps based on status
    if (validatedData.status === 'SHIPPED') {
      updateFields.shippedAt = new Date();
    } else if (validatedData.status === 'DELIVERED') {
      updateFields.deliveredAt = new Date();
    }

    const updatedOrder = await prisma.vendorOrder.update({
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
      const allVendorOrders = await prisma.vendorOrder.findMany({
        where: { orderId: vendorOrder.orderId },
      });

      const allShipped = allVendorOrders.every(order => order.status === 'SHIPPED' || order.status === 'DELIVERED');
      const allDelivered = allVendorOrders.every(order => order.status === 'DELIVERED');

      let mainOrderStatus: string;
      if (allDelivered) {
        mainOrderStatus = 'DELIVERED';
      } else if (allShipped) {
        mainOrderStatus = 'SHIPPED';
      } else {
        mainOrderStatus = 'PROCESSING';
      }

      await prisma.order.update({
        where: { id: vendorOrder.orderId },
        data: { 
          status: mainOrderStatus as any,
          ...(validatedData.status === 'SHIPPED' && { shippedAt: new Date() }),
          ...(validatedData.status === 'DELIVERED' && { deliveredAt: new Date() }),
        },
      });
    }

    // Send notification to customer
    // await notificationService.notifyOrderStatusUpdate(updatedOrder);

    return NextResponse.json({
      message: 'Order updated successfully',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Update vendor order error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
