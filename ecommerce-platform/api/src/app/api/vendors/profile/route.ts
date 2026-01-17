import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const vendorProfileUpdateSchema = z.object({
  businessName: z.string().min(2).optional(),
  businessEmail: z.string().email().optional(),
  businessPhone: z.string().optional(),
  businessDescription: z.string().optional(),
  businessAddress: z.object({
    street: z.string(),
    city: z.string(),
    province: z.string(),
    country: z.string(),
    postalCode: z.string(),
  }).optional(),
  taxId: z.string().optional(),
  websiteUrl: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
  settings: z.object({}).optional(),
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

    const vendor = await prisma.vendor.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
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
    });

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ vendor });
  } catch (error) {
    console.error('Get vendor profile error:', error);
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

    const body = await request.json();
    const validatedData = vendorProfileUpdateSchema.parse(body);

    const vendor = await prisma.vendor.findUnique({
      where: { userId: session.user.id },
    });

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor profile not found' },
        { status: 404 }
      );
    }

    // Check if business name is being changed and if it's already taken
    if (validatedData.businessName && validatedData.businessName !== vendor.businessName) {
      const existingVendor = await prisma.vendor.findFirst({
        where: { 
          businessName: validatedData.businessName,
          id: { not: vendor.id },
        },
      });

      if (existingVendor) {
        return NextResponse.json(
          { error: 'Business name already taken' },
          { status: 400 }
        );
      }
    }

    const updatedVendor = await prisma.vendor.update({
      where: { id: vendor.id },
      data: validatedData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Vendor profile updated successfully',
      vendor: updatedVendor,
    });
  } catch (error) {
    console.error('Update vendor profile error:', error);
    
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
