import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.session.deleteMany();
  await prisma.locationRequest.deleteMany();
  await prisma.location.deleteMany();
  await prisma.user.deleteMany();

  // Create test users
  const user1 = await prisma.user.create({
    data: {
      email: 'john@example.com',
      password: await bcrypt.hash('password123', 10),
      name: 'John Doe',
      isAdmin: false
    }
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'jane@example.com',
      password: await bcrypt.hash('password123', 10),
      name: 'Jane Smith',
      isAdmin: false
    }
  });

  const adminUser = await prisma.user.create({
    data: {
      email: 'test@test.com',
      password: await bcrypt.hash('password', 10),
      name: 'Admin User',
      isAdmin: true
    }
  });

  // Create locations
  const location1 = await prisma.location.create({
    data: {
      name: 'Central Park Courts',
      address: '123 Park Ave, New York, NY',
      instructions: 'Near the south entrance',
      isApproved: true
    }
  });

  const location2 = await prisma.location.create({
    data: {
      name: 'Community Center',
      address: '456 Main St, New York, NY',
      instructions: 'Indoor courts on 2nd floor',
      isApproved: true
    }
  });

  // Create test sessions
  const session1 = await prisma.session.create({
    data: {
      title: 'Morning Pickleball',
      description: 'Early morning casual game',
      location: {
        connect: { id: location1.id }
      },
      date: new Date('2024-04-01T09:00:00Z'),
      maxPlayers: 4,
      creatorId: user1.id,
      players: {
        connect: [{ id: user2.id }]
      }
    }
  });

  const session2 = await prisma.session.create({
    data: {
      title: 'Weekend Tournament Practice',
      description: 'Preparing for upcoming tournament',
      location: {
        connect: { id: location2.id }
      },
      date: new Date('2024-04-02T14:00:00Z'),
      maxPlayers: 8,
      creatorId: user2.id,
      players: {
        connect: [{ id: user1.id }]
      }
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