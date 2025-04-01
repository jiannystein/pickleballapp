import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Fetching approved locations');
    const locations = await prisma.location.findMany({
      where: {
        isApproved: true
      },
      select: {
        id: true,
        name: true,
        address: true,
        instructions: true,
        photoUrl: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`Found ${locations.length} approved locations`);
    return NextResponse.json(locations);
  } catch (error) {
    console.error('Failed to fetch locations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 