"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.PUT = PUT;
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
const next_auth_1 = require("next-auth");
const auth_1 = require("@/lib/auth");
const zod_1 = require("zod");
const vendorProfileUpdateSchema = zod_1.z.object({
    businessName: zod_1.z.string().min(2).optional(),
    businessEmail: zod_1.z.string().email().optional(),
    businessPhone: zod_1.z.string().optional(),
    businessDescription: zod_1.z.string().optional(),
    businessAddress: zod_1.z.object({
        street: zod_1.z.string(),
        city: zod_1.z.string(),
        province: zod_1.z.string(),
        country: zod_1.z.string(),
        postalCode: zod_1.z.string(),
    }).optional(),
    taxId: zod_1.z.string().optional(),
    websiteUrl: zod_1.z.string().url().optional(),
    logoUrl: zod_1.z.string().url().optional(),
    bannerUrl: zod_1.z.string().url().optional(),
    settings: zod_1.z.object({}).optional(),
});
async function GET(request) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const vendor = await prisma_1.prisma.vendor.findUnique({
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
            return server_1.NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
        }
        return server_1.NextResponse.json({ vendor });
    }
    catch (error) {
        console.error('Get vendor profile error:', error);
        return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
async function PUT(request) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const body = await request.json();
        const validatedData = vendorProfileUpdateSchema.parse(body);
        const vendor = await prisma_1.prisma.vendor.findUnique({
            where: { userId: session.user.id },
        });
        if (!vendor) {
            return server_1.NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
        }
        // Check if business name is being changed and if it's already taken
        if (validatedData.businessName && validatedData.businessName !== vendor.businessName) {
            const existingVendor = await prisma_1.prisma.vendor.findFirst({
                where: {
                    businessName: validatedData.businessName,
                    id: { not: vendor.id },
                },
            });
            if (existingVendor) {
                return server_1.NextResponse.json({ error: 'Business name already taken' }, { status: 400 });
            }
        }
        const updatedVendor = await prisma_1.prisma.vendor.update({
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
        return server_1.NextResponse.json({
            message: 'Vendor profile updated successfully',
            vendor: updatedVendor,
        });
    }
    catch (error) {
        console.error('Update vendor profile error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return server_1.NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
        }
        return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
