import { PrismaClient, ProductStatus, CartStatus, OrderStatus, PaymentStatus, AddressType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create categories
  console.log('Creating categories...');
  const electronicsCategory = await prisma.category.create({
    data: {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and gadgets',
      sortOrder: 1,
      isActive: true
    }
  });

  const clothingCategory = await prisma.category.create({
    data: {
      name: 'Clothing',
      slug: 'clothing',
      description: 'Fashion and apparel',
      sortOrder: 2,
      isActive: true
    }
  });

  const booksCategory = await prisma.category.create({
    data: {
      name: 'Books',
      slug: 'books',
      description: 'Books and educational materials',
      sortOrder: 3,
      isActive: true
    }
  });

  // Create products
  console.log('Creating products...');
  const products = await Promise.all([
    // Electronics products
    prisma.product.create({
      data: {
        name: 'Wireless Headphones',
        slug: 'wireless-headphones',
        description: 'Premium wireless headphones with noise cancellation and 30-hour battery life.',
        shortDesc: 'Premium wireless headphones',
        sku: 'WH-001',
        price: 199.99,
        comparePrice: 249.99,
        cost: 89.99,
        trackInventory: true,
        stock: 50,
        weight: 0.5,
        dimensions: { length: 20, width: 18, height: 8 },
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
          'https://images.unsplash.com/photo-1484704849700-f032be5d3a73?w=800'
        ],
        tags: ['wireless', 'headphones', 'audio', 'bluetooth'],
        status: ProductStatus.ACTIVE,
        featured: true,
        categoryId: electronicsCategory.id
      }
    }),
    prisma.product.create({
      data: {
        name: 'Smart Watch',
        slug: 'smart-watch',
        description: 'Feature-rich smartwatch with health tracking and notifications.',
        shortDesc: 'Advanced fitness smartwatch',
        sku: 'SW-002',
        price: 299.99,
        comparePrice: 349.99,
        cost: 129.99,
        trackInventory: true,
        stock: 30,
        weight: 0.1,
        dimensions: { length: 4, width: 4, height: 1 },
        images: [
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'
        ],
        tags: ['smartwatch', 'fitness', 'health', 'wearable'],
        status: ProductStatus.ACTIVE,
        featured: true,
        categoryId: electronicsCategory.id
      }
    }),
    prisma.product.create({
      data: {
        name: 'Laptop Pro',
        slug: 'laptop-pro',
        description: 'High-performance laptop for professionals and creators.',
        shortDesc: 'Professional grade laptop',
        sku: 'LP-003',
        price: 1299.99,
        comparePrice: 1499.99,
        cost: 799.99,
        trackInventory: true,
        stock: 15,
        weight: 2.5,
        dimensions: { length: 35, width: 25, height: 2 },
        images: [
          'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800'
        ],
        tags: ['laptop', 'computer', 'professional', 'work'],
        status: ProductStatus.ACTIVE,
        featured: false,
        categoryId: electronicsCategory.id
      }
    }),

    // Clothing products
    prisma.product.create({
      data: {
        name: 'Cotton T-Shirt',
        slug: 'cotton-t-shirt',
        description: 'Comfortable 100% cotton t-shirt perfect for everyday wear.',
        shortDesc: 'Premium cotton t-shirt',
        sku: 'CT-004',
        price: 29.99,
        comparePrice: 39.99,
        cost: 12.99,
        trackInventory: true,
        stock: 100,
        weight: 0.2,
        dimensions: { length: 30, width: 25, height: 2 },
        images: [
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800'
        ],
        tags: ['cotton', 't-shirt', 'casual', 'comfortable'],
        status: ProductStatus.ACTIVE,
        featured: true,
        categoryId: clothingCategory.id
      }
    }),
    prisma.product.create({
      data: {
        name: 'Denim Jeans',
        slug: 'denim-jeans',
        description: 'Classic fit denim jeans with modern styling.',
        shortDesc: 'Classic denim jeans',
        sku: 'DJ-005',
        price: 79.99,
        comparePrice: 99.99,
        cost: 35.99,
        trackInventory: true,
        stock: 60,
        weight: 0.8,
        dimensions: { length: 40, width: 30, height: 5 },
        images: [
          'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800'
        ],
        tags: ['denim', 'jeans', 'casual', 'classic'],
        status: ProductStatus.ACTIVE,
        featured: false,
        categoryId: clothingCategory.id
      }
    }),

    // Books
    prisma.product.create({
      data: {
        name: 'JavaScript Guide',
        slug: 'javascript-guide',
        description: 'Comprehensive guide to modern JavaScript development.',
        shortDesc: 'Complete JavaScript learning resource',
        sku: 'JB-006',
        price: 49.99,
        comparePrice: 69.99,
        cost: 19.99,
        trackInventory: true,
        stock: 200,
        weight: 0.5,
        dimensions: { length: 23, width: 15, height: 3 },
        images: [
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800'
        ],
        tags: ['javascript', 'programming', 'education', 'development'],
        status: ProductStatus.ACTIVE,
        featured: true,
        categoryId: booksCategory.id
      }
    }),
    prisma.product.create({
      data: {
        name: 'Design Principles',
        slug: 'design-principles',
        description: 'Essential design principles for modern applications.',
        shortDesc: 'Modern design fundamentals',
        sku: 'DP-007',
        price: 59.99,
        comparePrice: 79.99,
        cost: 24.99,
        trackInventory: true,
        stock: 75,
        weight: 0.6,
        dimensions: { length: 25, width: 18, height: 2 },
        images: [
          'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800'
        ],
        tags: ['design', 'ui', 'ux', 'principles'],
        status: ProductStatus.ACTIVE,
        featured: false,
        categoryId: booksCategory.id
      }
    })
  ]);

  // Create test user
  console.log('Creating test user...');
  const hashedPassword = await bcrypt.hash('password123', 12);
  const testUser = await prisma.user.create({
    data: {
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
      phone: '+1234567890',
      emailVerified: true
    }
  });

  // Create addresses for test user
  console.log('Creating addresses...');
  await prisma.address.create({
    data: {
      userId: testUser.id,
      type: AddressType.SHIPPING,
      firstName: 'Test',
      lastName: 'User',
      company: 'Test Company',
      address1: '123 Main Street',
      address2: 'Apt 4B',
      city: 'New York',
      province: 'NY',
      country: 'United States',
      postalCode: '10001',
      phone: '+1234567890',
      isDefault: true
    }
  });

  await prisma.address.create({
    data: {
      userId: testUser.id,
      type: AddressType.BILLING,
      firstName: 'Test',
      lastName: 'User',
      company: 'Test Company',
      address1: '123 Main Street',
      address2: 'Apt 4B',
      city: 'New York',
      province: 'NY',
      country: 'United States',
      postalCode: '10001',
      phone: '+1234567890',
      isDefault: true
    }
  });

  // Create sample coupons
  console.log('Creating coupons...');
  await Promise.all([
    prisma.coupon.create({
      data: {
        code: 'WELCOME10',
        name: 'Welcome Discount',
        description: '10% off for new customers',
        type: 'PERCENTAGE',
        value: 10,
        minimumAmount: 50,
        usageLimit: 100,
        usageCount: 0,
        isActive: true,
        startsAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    }),
    prisma.coupon.create({
      data: {
        code: 'FREESHIP',
        name: 'Free Shipping',
        description: 'Free shipping on orders over $100',
        type: 'FREE_SHIPPING',
        value: 0,
        minimumAmount: 100,
        usageLimit: 200,
        usageCount: 0,
        isActive: true,
        startsAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days
      }
    })
  ]);

  console.log('✅ Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Categories: 3`);
  console.log(`   - Products: ${products.length}`);
  console.log(`   - Test User: test@example.com (password: password123)`);
  console.log(`   - Coupons: 2`);
  console.log('\n🚀 Ready to start the API server!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
