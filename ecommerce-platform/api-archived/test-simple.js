const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSimple() {
  try {
    console.log('Testing simple database operations...');
    
    // Test creating a user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User'
      }
    });
    
    console.log('✅ User created:', user);
    
    // Test finding the user
    const foundUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });
    
    console.log('✅ User found:', foundUser);
    
    console.log('✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSimple();
