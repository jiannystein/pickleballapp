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

    const locationRequests = await prisma.locationRequest.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        instructions: true,
        status: true,
        requestedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return new NextResponse(JSON.stringify(locationRequests));
  } catch (error) {
    console.error('Error fetching location requests:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
} 