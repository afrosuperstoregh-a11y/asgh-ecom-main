"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.PUT = PUT;
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
const next_auth_1 = require("next-auth");
const auth_1 = require("@/lib/auth");
const zod_1 = require("zod");
const vendorApprovalSchema = zod_1.z.object({
    status: zod_1.z.enum(['APPROVED', 'REJECTED', 'SUSPENDED']),
    rejectionReason: zod_1.z.string().optional(),
    commissionRate: zod_1.z.number().min(0).max(100).optional(),
});
async function GET(request) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Check if user is admin
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: session.user.id },
        });
        if (!user || user.role !== 'ADMIN') {
            return server_1.NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        const where = {};
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
            prisma_1.prisma.vendor.findMany({
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
            prisma_1.prisma.vendor.count({ where }),
        ]);
        return server_1.NextResponse.json({
            vendors,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        console.error('Get admin vendors error:', error);
        return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
async function PUT(request) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Check if user is admin
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: session.user.id },
        });
        if (!user || user.role !== 'ADMIN') {
            return server_1.NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }
        const body = await request.json();
        const { vendorId, ...updateData } = body;
        if (!vendorId) {
            return server_1.NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 });
        }
        const validatedData = vendorApprovalSchema.parse(updateData);
        const vendor = await prisma_1.prisma.vendor.findUnique({
            where: { id: vendorId },
        });
        if (!vendor) {
            return server_1.NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
        }
        const updateFields = { ...validatedData };
        // Set vendor as active if approved
        if (validatedData.status === 'APPROVED') {
            updateFields.isActive = true;
        }
        else if (validatedData.status === 'SUSPENDED') {
            updateFields.isActive = false;
        }
        const updatedVendor = await prisma_1.prisma.vendor.update({
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
            await prisma_1.prisma.vendorNotification.create({
                data: {
                    vendorId,
                    type: 'SYSTEM',
                    title: 'Vendor Account Approved',
                    message: 'Congratulations! Your vendor account has been approved. You can now start selling on our marketplace.',
                    actionUrl: '/vendor/dashboard',
                },
            });
        }
        else if (validatedData.status === 'REJECTED') {
            await prisma_1.prisma.vendorNotification.create({
                data: {
                    vendorId,
                    type: 'SYSTEM',
                    title: 'Vendor Account Rejected',
                    message: `Your vendor account application has been rejected. Reason: ${validatedData.rejectionReason || 'Not specified'}`,
                },
            });
        }
        else if (validatedData.status === 'SUSPENDED') {
            await prisma_1.prisma.vendorNotification.create({
                data: {
                    vendorId,
                    type: 'SYSTEM',
                    title: 'Vendor Account Suspended',
                    message: 'Your vendor account has been suspended. Please contact support for more information.',
                },
            });
        }
        return server_1.NextResponse.json({
            message: `Vendor ${validatedData.status.toLowerCase()} successfully`,
            vendor: updatedVendor,
        });
    }
    catch (error) {
        console.error('Update admin vendor error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return server_1.NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
        }
        return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
