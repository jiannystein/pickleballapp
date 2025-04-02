import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create test users
  const user1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      password: await bcrypt.hash('user123', 10),
      name: 'John Doe',
      isAdmin: false
    }
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'jane@example.com' },
    update: {},
    create: {
      email: 'jane@example.com',
      password: await bcrypt.hash('user123', 10),
      name: 'Jane Smith',
      isAdmin: false
    }
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: await bcrypt.hash('admin123', 10),
      name: 'Admin User',
      isAdmin: true
    }
  });

  // Create locations
  const location1 = await prisma.location.upsert({
    where: { id: 'location1' },
    update: {
      photoUrl: '/uploads/locations/PickleParadise.webp'
    },
    create: {
      id: 'location1',
      name: 'Pickle Paradise Bukit Mertajam',
      address: 'Pickle Paradise, Fasa 1, Taman Mutiara, Bukit Mertajam, Penang',
      instructions: 'Entrance via side gate at Lebuh Keranji',
      isApproved: true,
      photoUrl: '/uploads/locations/PickleParadise.webp'
    }
  });

  const location2 = await prisma.location.upsert({
    where: { id: 'location2' },
    update: {
      photoUrl: '/uploads/locations/Vangohh.webp'
    },
    create: {
      id: 'location2',
      name: 'Picker Pickle @ Vangohh Eminent',
      address: 'Vangohh Eminent, Jalan Machang Bubok 2, Taman Machang Bubok, Bukit Mertajam, Penang',
      instructions: 'Upon entering the main gate, drive and park at the parking lot located on the right side of Vangohh Eminent.Picker Pickle is located on the 4th floor at the rooftop parking bay of Vangohh Eminent',
      isApproved: true,
      photoUrl: '/uploads/locations/Vangohh.webp'
    }
  });

  const location3 = await prisma.location.upsert({
    where: { id: 'location3' },
    update: {
      photoUrl: '/uploads/locations/JuruSetia.webp'
    },
    create: {
      id: 'location3',
      name: 'Picker Pickle @ Juru Setia Sentral',
      address: '4th Floor, No.3-4, Lorong Setia Sentral 1, Pusat Perniagaan Setia Sentral, Bukit Mertajam, Penang',
      instructions: 'You can either reach the location via Juru Highway or via the Lok Yuen Restaurant route',
      isApproved: true,
      photoUrl: '/uploads/locations/JuruSetia.webp'
    }
  });

  // Set up site configuration
  const logoUrl = '/uploads/logo/default-logo.png';
  const faviconUrl = '/uploads/logo/default-favicon.ico';

  // Upsert logo configuration
  await prisma.siteConfig.upsert({
    where: { key: 'logo' },
    update: { value: logoUrl },
    create: {
      key: 'logo',
      value: logoUrl
    }
  });

  // Upsert favicon configuration
  await prisma.siteConfig.upsert({
    where: { key: 'favicon' },
    update: { value: faviconUrl },
    create: {
      key: 'favicon',
      value: faviconUrl
    }
  });

  console.log('Database seeded with test data!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 