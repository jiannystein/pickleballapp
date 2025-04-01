const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Querying users...');
  const users = await prisma.user.findMany();
  console.log('Users in database:');
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch((e) => {
    console.error('Error querying users:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 