const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Update admin user to set isAdmin = true
  const updatedAdmin = await prisma.user.update({
    where: { email: 'admin@example.com' },
    data: { isAdmin: true }
  });

  console.log('Admin user updated:');
  console.log(JSON.stringify(updatedAdmin, null, 2));
}

main()
  .catch((e) => {
    console.error('Error updating admin user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 