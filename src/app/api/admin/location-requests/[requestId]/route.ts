import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const user = await getUser(request);
    if (!user?.isAdmin) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
      });
    }

    const body = await request.json();
    const { status } = body;

    if (status !== 'approved' && status !== 'rejected') {
      return new NextResponse(JSON.stringify({ error: 'Invalid status' }), {
        status: 400,
      });
    }

    const locationRequest = await prisma.locationRequest.findUnique({
      where: { id: params.requestId },
    });

    if (!locationRequest) {
      return new NextResponse(JSON.stringify({ error: 'Location request not found' }), {
        status: 404,
      });
    }

    // Handle the status update and location creation in a transaction
    if (status === 'approved') {
      // Create location data object with base properties
      const locationData = {
        name: locationRequest.name,
        address: locationRequest.address,
        instructions: locationRequest.instructions,
        isApproved: true,
      };
      
      // Add photoUrl and bookingUrl if they exist on the request
      // Need to use any type here because TypeScript doesn't recognize these properties yet
      const requestWithExtras = locationRequest as any;
      if (requestWithExtras.photoUrl) {
        (locationData as any).photoUrl = requestWithExtras.photoUrl;
      }
      
      if (requestWithExtras.bookingUrl) {
        (locationData as any).bookingUrl = requestWithExtras.bookingUrl;
      }

      await prisma.$transaction([
        prisma.locationRequest.update({
          where: { id: params.requestId },
          data: { status },
        }),
        prisma.location.create({
          data: locationData,
        }),
      ]);
    } else {
      await prisma.locationRequest.update({
        where: { id: params.requestId },
        data: { status },
      });
    }

    return new NextResponse(JSON.stringify({ success: true }));
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
      return new NextResponse(JSON.stringify({ error: 'Location request not found' }), {
        status: 404,
      });
    }
    console.error('Error updating location request:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const user = await getUser(request);
    if (!user?.isAdmin) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
      });
    }

    // Delete the location request
    await prisma.locationRequest.delete({
      where: { id: params.requestId },
    });

    return new NextResponse(JSON.stringify({ success: true }));
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
      return new NextResponse(JSON.stringify({ error: 'Location request not found' }), {
        status: 404,
      });
    }
    console.error('Error deleting location request:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const user = await getUser(request);
    if (!user?.isAdmin) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
      });
    }

    const body = await request.json();
    const { action } = body;
    
    // Convert action to status
    let status;
    if (action === 'approve') {
      status = 'approved';
    } else if (action === 'reject') {
      status = 'rejected';
    } else {
      return new NextResponse(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
      });
    }

    const locationRequest = await prisma.locationRequest.findUnique({
      where: { id: params.requestId },
    });

    if (!locationRequest) {
      return new NextResponse(JSON.stringify({ error: 'Location request not found' }), {
        status: 404,
      });
    }

    // Handle the status update and location creation in a transaction
    if (status === 'approved') {
      // Create location data object with base properties
      const locationData = {
        name: locationRequest.name,
        address: locationRequest.address,
        instructions: locationRequest.instructions,
        isApproved: true,
      };
      
      // Add photoUrl and bookingUrl if they exist on the request
      // Need to use any type here because TypeScript doesn't recognize these properties yet
      const requestWithExtras = locationRequest as any;
      if (requestWithExtras.photoUrl) {
        (locationData as any).photoUrl = requestWithExtras.photoUrl;
      }
      
      if (requestWithExtras.bookingUrl) {
        (locationData as any).bookingUrl = requestWithExtras.bookingUrl;
      }

      await prisma.$transaction([
        prisma.locationRequest.update({
          where: { id: params.requestId },
          data: { status },
        }),
        prisma.location.create({
          data: locationData,
        }),
      ]);
    } else {
      await prisma.locationRequest.update({
        where: { id: params.requestId },
        data: { status },
      });
    }

    return new NextResponse(JSON.stringify({ success: true }));
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
      return new NextResponse(JSON.stringify({ error: 'Location request not found' }), {
        status: 404,
      });
    }
    console.error('Error updating location request:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
} 