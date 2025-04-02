import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// GET a specific location by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { locationId: string } }
) {
  try {
    const user = await getUser(request);
    if (!user?.isAdmin) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
      });
    }

    const location = await prisma.location.findUnique({
      where: { id: params.locationId }
    });

    if (!location) {
      return new NextResponse(JSON.stringify({ error: 'Location not found' }), {
        status: 404,
      });
    }

    return new NextResponse(JSON.stringify(location));
  } catch (error) {
    console.error('Error fetching location:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}

// Update a location
export async function PATCH(
  request: NextRequest,
  { params }: { params: { locationId: string } }
) {
  try {
    const user = await getUser(request);
    if (!user?.isAdmin) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
      });
    }

    const body = await request.json();
    const { name, address, instructions, photoUrl, bookingUrl } = body;

    // Validate input
    if (!name || !address) {
      return new NextResponse(JSON.stringify({ error: 'Name and address are required' }), {
        status: 400,
      });
    }

    // Update the location
    const updatedLocation = await prisma.location.update({
      where: { id: params.locationId },
      data: {
        name,
        address,
        instructions,
        photoUrl,
        bookingUrl,
      }
    });

    return new NextResponse(JSON.stringify(updatedLocation));
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
      return new NextResponse(JSON.stringify({ error: 'Location not found' }), {
        status: 404,
      });
    }
    console.error('Error updating location:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}

// Delete a location
export async function DELETE(
  request: NextRequest,
  { params }: { params: { locationId: string } }
) {
  try {
    const user = await getUser(request);
    if (!user?.isAdmin) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
      });
    }

    // Delete the location
    await prisma.location.delete({
      where: { id: params.locationId }
    });

    return new NextResponse(JSON.stringify({ success: true }));
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
      return new NextResponse(JSON.stringify({ error: 'Location not found' }), {
        status: 404,
      });
    }
    console.error('Error deleting location:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
} 