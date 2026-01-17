import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const vendorApprovalSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'SUSPENDED']),
  rejectionReason: z.string().optional(),
  commissionRate: z.number().min(0).max(100).optional(),
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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {};
    
    if (status) {
      where.verificationStatus = status.toUpperCase();
    }
    
    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: 'insensitive' } },
        { businessEmail: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              products: true,
              vendorOrders: true,
              vendorReviews: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.vendor.count({ where }),
    ]);

    return NextResponse.json({
      vendors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get admin vendors error:', error);
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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { vendorId, ...updateData } = body;

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    const validatedData = vendorApprovalSchema.parse(updateData);

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    const updateFields: any = { ...validatedData };
    
    // Set vendor as active if approved
    if (validatedData.status === 'APPROVED') {
      updateFields.isActive = true;
    } else if (validatedData.status === 'SUSPENDED') {
      updateFields.isActive = false;
    }

    const updatedVendor = await prisma.vendor.update({
      where: { id: vendorId },
      data: updateFields,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    // Send notification to vendor
    if (validatedData.status === 'APPROVED') {
      await prisma.vendorNotification.create({
        data: {
          vendorId,
          type: 'SYSTEM',
          title: 'Vendor Account Approved',
          message: 'Congratulations! Your vendor account has been approved. You can now start selling on our marketplace.',
          actionUrl: '/vendor/dashboard',
        },
      });
    } else if (validatedData.status === 'REJECTED') {
      await prisma.vendorNotification.create({
        data: {
          vendorId,
          type: 'SYSTEM',
          title: 'Vendor Account Rejected',
          message: `Your vendor account application has been rejected. Reason: ${validatedData.rejectionReason || 'Not specified'}`,
        },
      });
    } else if (validatedData.status === 'SUSPENDED') {
      await prisma.vendorNotification.create({
        data: {
          vendorId,
          type: 'SYSTEM',
          title: 'Vendor Account Suspended',
          message: 'Your vendor account has been suspended. Please contact support for more information.',
        },
      });
    }

    return NextResponse.json({
      message: `Vendor ${validatedData.status.toLowerCase()} successfully`,
      vendor: updatedVendor,
    });
  } catch (error) {
    console.error('Update admin vendor error:', error);
    
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
