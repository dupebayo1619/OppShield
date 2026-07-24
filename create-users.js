const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createUsers() {
  try {
    // Delete existing if any
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['member-a@opsshield.io', 'admin-b@opsshield.io']
        }
      }
    });
    console.log('✅ Existing users deleted');

    // Create Member A
    const memberA = await prisma.user.create({
      data: {
        email: 'member-a@opsshield.io',
        passwordHash: 'temp_member_a_hash',
        firstName: 'Member',
        lastName: 'A',
        role: 'member'
      }
    });
    console.log('✅ Member A created:', memberA.email);

    // Create Admin B
    const adminB = await prisma.user.create({
      data: {
        email: 'admin-b@opsshield.io',
        passwordHash: 'temp_admin_b_hash',
        firstName: 'Admin',
        lastName: 'B',
        role: 'admin'
      }
    });
    console.log('✅ Admin B created:', adminB.email);

    console.log('✅ All users created successfully');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}
createUsers();
