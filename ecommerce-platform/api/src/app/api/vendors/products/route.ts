import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const vendorProductSchema = z.object({
  productId: z.string().uuid(),
  sku: z.string().min(1),
  costPrice: z.number().min(0).optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  inventoryCount: z.number().min(0).default(0),
  reorderLevel: z.number().min(0).default(0),
  vendorNotes: z.string().optional(),
});

const bulkProductSchema = z.object({
  products: z.array(vendorProductSchema.omit({ productId: true }).extend({
    name: z.string().min(1),
    description: z.string().optional(),
    price: z.number().min(0),
    categoryId: z.string().uuid(),
    images: z.array(z.string().url()).optional(),
  })),
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
      where.approvalStatus = status.toUpperCase();
    }
    
    if (search) {
      where.OR = [
        { product: { name: { contains: search, mode: 'insensitive' } } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.vendorProduct.findMany({
        where,
        include: {
          product: {
            include: {
              category: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.vendorProduct.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get vendor products error:', error);
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

    const body = await request.json();
    
    // Check if this is a bulk upload
    if (body.products && Array.isArray(body.products)) {
      const validatedData = bulkProductSchema.parse(body);
      
      const results = await prisma.$transaction(async (tx) => {
        const createdProducts = [];
        
        for (const productData of validatedData.products) {
          // Create product first
          const product = await tx.product.create({
            data: {
              name: productData.name,
              slug: `${productData.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
              description: productData.description,
              sku: productData.sku,
              price: productData.price,
              categoryId: productData.categoryId,
              vendorId: vendor.id,
              isMarketplace: true,
              status: 'DRAFT',
              images: productData.images || [],
            },
          });

          // Create vendor product
          const vendorProduct = await tx.vendorProduct.create({
            data: {
              vendorId: vendor.id,
              productId: product.id,
              sku: productData.sku,
              costPrice: productData.costPrice,
              commissionRate: productData.commissionRate,
              inventoryCount: productData.inventoryCount,
              reorderLevel: productData.reorderLevel,
              vendorNotes: productData.vendorNotes,
              approvalStatus: 'PENDING',
            },
          });

          createdProducts.push({ product, vendorProduct });
        }
        
        return createdProducts;
      });

      return NextResponse.json({
        message: `Successfully created ${results.length} products`,
        products: results,
      });
    } else {
      // Single product creation
      const validatedData = vendorProductSchema.parse(body);
      
      // Check if product exists and belongs to vendor
      const product = await prisma.product.findUnique({
        where: { id: validatedData.productId },
      });

      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }

      if (product.vendorId && product.vendorId !== vendor.id) {
        return NextResponse.json(
          { error: 'Product belongs to different vendor' },
          { status: 403 }
        );
      }

      // Check if vendor product already exists
      const existingVendorProduct = await prisma.vendorProduct.findUnique({
        where: {
          vendorId_productId: {
            vendorId: vendor.id,
            productId: validatedData.productId,
          },
        },
      });

      if (existingVendorProduct) {
        return NextResponse.json(
          { error: 'Vendor product already exists' },
          { status: 400 }
        );
      }

      const vendorProduct = await prisma.vendorProduct.create({
        data: {
          ...validatedData,
          vendorId: vendor.id,
          approvalStatus: 'PENDING',
        },
        include: {
          product: {
            include: {
              category: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
        },
      });

      return NextResponse.json({
        message: 'Vendor product created successfully',
        vendorProduct,
      });
    }
  } catch (error) {
    console.error('Create vendor product error:', error);
    
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
