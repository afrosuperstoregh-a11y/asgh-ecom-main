"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
const bcryptjs_1 = require("bcryptjs");
const zod_1 = require("zod");
const vendorRegistrationSchema = zod_1.z.object({
    // User information
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    name: zod_1.z.string().min(2),
    phone: zod_1.z.string().optional(),
    // Business information
    businessName: zod_1.z.string().min(2),
    businessEmail: zod_1.z.string().email(),
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
    // Terms acceptance
    acceptTerms: zod_1.z.boolean().refine(val => val === true, {
        message: 'You must accept the terms and conditions',
    }),
});
async function POST(request) {
    try {
        const body = await request.json();
        const validatedData = vendorRegistrationSchema.parse(body);
        // Check if user already exists
        const existingUser = await prisma_1.prisma.user.findUnique({
            where: { email: validatedData.email },
        });
        if (existingUser) {
            return server_1.NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
        }
        // Check if business name already exists
        const existingVendor = await prisma_1.prisma.vendor.findFirst({
            where: { businessName: validatedData.businessName },
        });
        if (existingVendor) {
            return server_1.NextResponse.json({ error: 'Business name already taken' }, { status: 400 });
        }
        // Hash password
        const hashedPassword = await (0, bcryptjs_1.hash)(validatedData.password, 12);
        // Create user and vendor in a transaction
        const result = await prisma_1.prisma.$transaction(async (tx) => {
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
        return server_1.NextResponse.json({
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
    }
    catch (error) {
        console.error('Vendor registration error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return server_1.NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
        }
        return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
