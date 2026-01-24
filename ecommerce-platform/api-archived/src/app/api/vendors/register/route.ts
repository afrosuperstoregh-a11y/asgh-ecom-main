import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { z } from 'zod';

const vendorRegistrationSchema = z.object({
  // User information
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  phone: z.string().optional(),
  
  // Business information
  businessName: z.string().min(2),
  businessEmail: z.string().email(),
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
  
  // Terms acceptance
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions',
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = vendorRegistrationSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Check if business name already exists
    const existingVendor = await prisma.vendor.findFirst({
      where: { businessName: validatedData.businessName },
    });

    if (existingVendor) {
      return NextResponse.json(
        { error: 'Business name already taken' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(validatedData.password, 12);

    // Create user and vendor in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: validatedData.email,
          password: hashedPassword,
          name: validatedData.name,
          phone: validatedData.phone,
          role: 'VENDOR',
        },
      });

      // Create vendor
      const vendor = await tx.vendor.create({
        data: {
          userId: user.id,
          businessName: validatedData.businessName,
          businessEmail: validatedData.businessEmail,
          businessPhone: validatedData.businessPhone,
          businessDescription: validatedData.businessDescription,
          businessAddress: validatedData.businessAddress,
          taxId: validatedData.taxId,
          websiteUrl: validatedData.websiteUrl,
          verificationStatus: 'PENDING',
          commissionRate: 10.00, // Default commission rate
        },
      });

      // Update user with vendor ID
      await tx.user.update({
        where: { id: user.id },
        data: { vendorId: vendor.id },
      });

      return { user, vendor };
    });

    // Send welcome email (implement email service)
    // await emailService.sendVendorWelcomeEmail(result.user.email, result.vendor);

    return NextResponse.json({
      message: 'Vendor registration successful. Please wait for approval.',
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      },
      vendor: {
        id: result.vendor.id,
        businessName: result.vendor.businessName,
        verificationStatus: result.vendor.verificationStatus,
      },
    });
  } catch (error) {
    console.error('Vendor registration error:', error);
    
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
