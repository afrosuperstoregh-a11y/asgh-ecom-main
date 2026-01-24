import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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

    const [payouts, total] = await Promise.all([
      prisma.vendorPayout.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.vendorPayout.count({ where }),
    ]);

    return NextResponse.json({
      payouts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get vendor payouts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    if (!vendor.stripeConnectId) {
      return NextResponse.json(
        { error: 'Stripe Connect account not set up' },
        { status: 400 }
      );
    }

    // Check if there's already a pending payout
    const existingPendingPayout = await prisma.vendorPayout.findFirst({
      where: {
        vendorId: vendor.id,
        status: 'PENDING',
      },
    });

    if (existingPendingPayout) {
      return NextResponse.json(
        { error: 'There is already a pending payout' },
        { status: 400 }
      );
    }

    // Calculate payout amount from completed orders
    const completedOrders = await prisma.vendorOrder.findMany({
      where: {
        vendorId: vendor.id,
        status: 'DELIVERED',
        // Only include orders not already paid out
        payoutId: null,
      },
    });

    if (completedOrders.length === 0) {
      return NextResponse.json(
        { error: 'No completed orders available for payout' },
        { status: 400 }
      );
    }

    const totalEarnings = completedOrders.reduce((sum, order) => sum + order.vendorEarnings, 0);
    const totalCommission = completedOrders.reduce((sum, order) => sum + order.commissionAmount, 0);
    const processingFee = totalEarnings * 0.025; // 2.5% processing fee
    const payoutAmount = totalEarnings - processingFee;

    if (payoutAmount < 10) { // Minimum payout amount
      return NextResponse.json(
        { error: 'Payout amount is below minimum threshold' },
        { status: 400 }
      );
    }

    // Create payout record
    const payout = await prisma.$transaction(async (tx) => {
      const newPayout = await tx.vendorPayout.create({
        data: {
          vendorId: vendor.id,
          payoutReference: `PO-${Date.now()}-${vendor.id.slice(-8)}`,
          amount: payoutAmount,
          status: 'PENDING',
          periodStart: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
          periodEnd: new Date(),
          orderCount: completedOrders.length,
          commissionTotal: totalCommission,
          processingFee,
        },
      });

      // Mark orders as included in this payout
      await tx.vendorOrder.updateMany({
        where: {
          id: { in: completedOrders.map(order => order.id) },
        },
        data: {
          payoutId: newPayout.id,
        },
      });

      return newPayout;
    });

    // Process Stripe transfer (implement in background job)
    // await stripeService.processPayout(payout.id);

    return NextResponse.json({
      message: 'Payout request submitted successfully',
      payout,
    });
  } catch (error) {
    console.error('Create vendor payout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
