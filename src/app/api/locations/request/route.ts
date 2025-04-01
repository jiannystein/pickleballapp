import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    console.log('User creating location request:', JSON.stringify(user));

    const body = await request.json();
    const { name, address, instructions } = body;

    if (!name || !address) {
      return new NextResponse(JSON.stringify({ error: 'Name and address are required' }), {
        status: 400,
      });
    }

    const locationRequest = await prisma.locationRequest.create({
      data: {
        name,
        address,
        instructions,
        status: 'pending',
        userId: user.userId,
      },
    });

    console.log('Location request created successfully:', JSON.stringify(locationRequest));
    return new NextResponse(JSON.stringify(locationRequest));
  } catch (error) {
    console.error('Error creating location request:', error);
    return new NextResponse(JSON.stringify({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
    });
  }
} 