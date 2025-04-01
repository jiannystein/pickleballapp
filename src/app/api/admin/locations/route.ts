import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user?.isAdmin) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
      });
    }

    const locations = await prisma.location.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        instructions: true,
        isApproved: true,
        createdAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return new NextResponse(JSON.stringify(locations));
  } catch (error) {
    console.error('Error fetching locations:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
} 